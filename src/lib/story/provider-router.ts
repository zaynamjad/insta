import type { StoryProvider, RequestHints } from "./provider";
import { ProviderError } from "./provider";
import type { ApiProviderId } from "./key-store";
import { planProviders, providerLabel, type ApiProviderSettings } from "./provider-settings";
import { recordAttempt, type ProviderAttemptRecord } from "./provider-stats";
import { CallBudgetError } from "./call-budget";
import { isCircuitOpen, recordProviderFailure, recordProviderSuccess } from "./circuit-breaker";
import type { Profile } from "@/types/profile";
import type { Post } from "@/types/post";
import type { Story } from "@/types/story";
import type { HighlightMeta } from "@/types/highlight";

export type StoryOperation =
  | "getProfile"
  | "getStories"
  | "getBasicProfile"
  | "getPosts"
  | "getPostByShortcode"
  | "getHighlights"
  | "getHighlightItems";

/**
 * Which operations each provider genuinely supports. Scrape Creators has no
 * Stories endpoint, so `getProfile` (profile + Stories) is HikerAPI-only —
 * it is skipped for Scrape Creators rather than answered with a fake empty
 * Stories list.
 */
export const SUPPORTED_OPERATIONS: Record<ApiProviderId, ReadonlySet<StoryOperation>> = {
  hikerapi: new Set<StoryOperation>([
    "getProfile",
    "getStories",
    "getBasicProfile",
    "getPosts",
    "getPostByShortcode",
    "getHighlights",
    "getHighlightItems",
  ]),
  scrapecreators: new Set<StoryOperation>([
    "getBasicProfile",
    "getPosts",
    "getPostByShortcode",
    "getHighlights",
    "getHighlightItems",
  ]),
};

/**
 * What the keyless Instaloader tier can serve anonymously. Stories and
 * Highlights need an Instagram login, and a single post/highlight by URL is
 * not offered, so those go straight to the paid providers.
 */
export const INSTALOADER_OPERATIONS: ReadonlySet<StoryOperation> = new Set<StoryOperation>([
  "getBasicProfile",
  "getPosts",
]);

/** The configuration a request started with; later dashboard changes don't affect it. */
export interface RoutingSnapshot {
  settings: ApiProviderSettings;
  configured: Record<ApiProviderId, boolean>;
  /** True when Instaloader is enabled and correctly configured (see `hybrid-config`). */
  instaloaderReady?: boolean;
}

export type RouteClients = Record<ApiProviderId, StoryProvider> & { instaloader?: StoryProvider };

export type AttemptRecorder = (rec: ProviderAttemptRecord) => Promise<void>;

type RouteProviderId = ApiProviderId | "instaloader";

// Simultaneous identical requests (same operation, argument and provider
// plan) share one upstream call instead of each spending credits.
const inFlight = new Map<string, Promise<unknown>>();

/**
 * The one `StoryProvider` the rest of the app talks to when any API
 * provider is configured. Per operation it asks `planProviders` for the
 * ordered Primary → Fallback list, calls the first, and moves to the next
 * only when the failure is explicitly `retryable` (timeout, network, 429,
 * 402, 5xx). A definitive answer — including "not found" (null) — or a
 * non-retryable error (invalid input, bad credentials) is returned/thrown
 * as-is. The chain has at most two providers and never loops.
 */
export class RoutedStoryProvider implements StoryProvider {
  constructor(
    private readonly snapshot: RoutingSnapshot,
    private readonly clients: RouteClients,
    private readonly record: AttemptRecorder = recordAttempt,
  ) {}

  getProfile(username: string): Promise<Profile | null> {
    return this.run("getProfile", username, (p) => p.getProfile(username));
  }

  getStories(username: string, hints?: RequestHints): Promise<Story[]> {
    return this.run("getStories", username, (p) => p.getStories!(username, hints));
  }

  getBasicProfile(username: string): Promise<Profile | null> {
    return this.run("getBasicProfile", username, (p) =>
      p.getBasicProfile ? p.getBasicProfile(username) : p.getProfile(username),
    );
  }

  getPosts(username: string, hints?: RequestHints): Promise<Post[]> {
    return this.run("getPosts", username, (p) => p.getPosts!(username, hints));
  }

  getPostByShortcode(shortcode: string): Promise<Post | null> {
    return this.run("getPostByShortcode", shortcode, (p) => p.getPostByShortcode!(shortcode));
  }

  getHighlights(username: string, hints?: RequestHints): Promise<HighlightMeta[]> {
    return this.run("getHighlights", username, (p) => p.getHighlights!(username, hints));
  }

  getHighlightItems(
    highlightUrl: string,
  ): Promise<{ title: string; coverImageUrl: string | null; items: Story[] } | null> {
    return this.run("getHighlightItems", highlightUrl, (p) => p.getHighlightItems!(highlightUrl));
  }

  private run<T>(op: StoryOperation, arg: string, call: (p: StoryProvider) => Promise<T>): Promise<T> {
    const paid = planProviders(this.snapshot.settings, this.snapshot.configured, (id) =>
      SUPPORTED_OPERATIONS[id].has(op),
    );
    // Instaloader goes first, but only for what it can really serve and only when it is switched on.
    const tryInstaloader =
      !!this.snapshot.instaloaderReady && !!this.clients.instaloader && INSTALOADER_OPERATIONS.has(op);
    const plan: RouteProviderId[] = tryInstaloader ? ["instaloader", ...paid] : paid;
    if (plan.length === 0) {
      return Promise.reject(
        new ProviderError("No enabled provider supports this operation.", "CONTENT_UNAVAILABLE"),
      );
    }

    const key = `${op}\u0000${arg}\u0000${plan.join(">")}`;
    const existing = inFlight.get(key);
    if (existing) return existing as Promise<T>;

    const promise = this.execute(op, plan, call).finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  }

  private async execute<T>(
    op: StoryOperation,
    plan: RouteProviderId[],
    call: (p: StoryProvider) => Promise<T>,
  ): Promise<T> {
    let attempts = 0;
    let lastError: unknown;
    let fallbackReason: string | undefined;

    for (const id of plan) {
      // A provider whose circuit is open is skipped, not retried: sending it more traffic only adds latency and spend.
      if (await isCircuitOpen(id)) {
        fallbackReason ??= `${id} circuit open`;
        continue;
      }

      const isFallback = attempts > 0;
      attempts += 1;
      const started = Date.now();
      try {
        const result = await call(this.clients[id]!);
        await recordProviderSuccess(id);
        await this.record({
          provider: id,
          operation: op,
          ok: true,
          isFallback,
          durationMs: Date.now() - started,
          ...(isFallback && fallbackReason ? { fallbackReason } : {}),
        });
        return result;
      } catch (err) {
        lastError = err;
        const retryable = err instanceof ProviderError && err.retryable;
        // Only a failure the provider itself caused counts toward its breaker — not our own call budget,
        // and not a non-retryable answer like invalid input.
        if (retryable && !(err instanceof CallBudgetError)) {
          if (await recordProviderFailure(id)) console.warn(`[provider-router] circuit opened for ${providerLabel(id)}`);
        }
        const reasonForThisAttempt = isFallback ? fallbackReason : undefined;
        fallbackReason = err instanceof ProviderError ? `${id}: ${err.code}` : `${id}: unexpected error`;
        await this.record({
          provider: id,
          operation: op,
          ok: false,
          isFallback,
          durationMs: Date.now() - started,
          error: err instanceof ProviderError ? `${err.code}: ${err.message}` : "unexpected error",
          ...(reasonForThisAttempt ? { fallbackReason: reasonForThisAttempt } : {}),
        });
        const hasNext = plan.slice(plan.indexOf(id) + 1).length > 0;
        if (!retryable || !hasNext) throw err;
        console.warn(`[provider-router] ${op}: ${providerLabel(id)} failed (${(err as ProviderError).code}); trying the next provider`);
      }
    }

    if (lastError !== undefined) throw lastError;
    // Every provider in the plan had an open circuit: fail fast instead of calling any of them.
    throw new ProviderError("Providers are temporarily unavailable. Please try again shortly.", "UPSTREAM_ERROR");
  }
}
