import type { StoryProvider } from "./provider";
import { ProviderError } from "./provider";
import type { ApiProviderId } from "./key-store";
import { planProviders, PROVIDER_LABELS, type ApiProviderSettings } from "./provider-settings";
import { recordAttempt, type ProviderAttemptRecord } from "./provider-stats";
import type { Profile } from "@/types/profile";
import type { Post } from "@/types/post";
import type { Story } from "@/types/story";
import type { HighlightMeta } from "@/types/highlight";

export type StoryOperation =
  | "getProfile"
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

/** The configuration a request started with; later dashboard changes don't affect it. */
export interface RoutingSnapshot {
  settings: ApiProviderSettings;
  configured: Record<ApiProviderId, boolean>;
}

export type AttemptRecorder = (rec: ProviderAttemptRecord) => Promise<void>;

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
    private readonly clients: Record<ApiProviderId, StoryProvider>,
    private readonly record: AttemptRecorder = recordAttempt,
  ) {}

  getProfile(username: string): Promise<Profile | null> {
    return this.run("getProfile", username, (p) => p.getProfile(username));
  }

  getBasicProfile(username: string): Promise<Profile | null> {
    return this.run("getBasicProfile", username, (p) =>
      p.getBasicProfile ? p.getBasicProfile(username) : p.getProfile(username),
    );
  }

  getPosts(username: string): Promise<Post[]> {
    return this.run("getPosts", username, (p) => p.getPosts!(username));
  }

  getPostByShortcode(shortcode: string): Promise<Post | null> {
    return this.run("getPostByShortcode", shortcode, (p) => p.getPostByShortcode!(shortcode));
  }

  getHighlights(username: string): Promise<HighlightMeta[]> {
    return this.run("getHighlights", username, (p) => p.getHighlights!(username));
  }

  getHighlightItems(
    highlightUrl: string,
  ): Promise<{ title: string; coverImageUrl: string | null; items: Story[] } | null> {
    return this.run("getHighlightItems", highlightUrl, (p) => p.getHighlightItems!(highlightUrl));
  }

  private run<T>(op: StoryOperation, arg: string, call: (p: StoryProvider) => Promise<T>): Promise<T> {
    const plan = planProviders(this.snapshot.settings, this.snapshot.configured, (id) =>
      SUPPORTED_OPERATIONS[id].has(op),
    );
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
    plan: ApiProviderId[],
    call: (p: StoryProvider) => Promise<T>,
  ): Promise<T> {
    for (let i = 0; i < plan.length; i++) {
      const id = plan[i];
      const started = Date.now();
      try {
        const result = await call(this.clients[id]);
        await this.record({
          provider: id,
          operation: op,
          ok: true,
          isFallback: i > 0,
          durationMs: Date.now() - started,
        });
        return result;
      } catch (err) {
        const retryable = err instanceof ProviderError && err.retryable;
        await this.record({
          provider: id,
          operation: op,
          ok: false,
          isFallback: i > 0,
          durationMs: Date.now() - started,
          error: err instanceof ProviderError ? `${err.code}: ${err.message}` : "unexpected error",
        });
        const next = plan[i + 1];
        if (!retryable || !next) throw err;
        console.warn(
          `[provider-router] ${op}: ${PROVIDER_LABELS[id]} failed (${(err as ProviderError).code}); trying ${PROVIDER_LABELS[next]}`,
        );
      }
    }
    // Unreachable: the loop either returns or throws on its last iteration.
    throw new ProviderError("No provider could complete the request.", "UPSTREAM_ERROR");
  }
}
