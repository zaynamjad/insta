import type { StoryProvider } from "./provider";
import { ProviderError } from "./provider";
import type { Profile } from "@/types/profile";
import { validateUsername } from "./validation";
import { checkOutboundRateLimit } from "./rate-limit";
import { parseProfilePage, looksLikeAccessBlocked } from "./parser";
import { hasEnoughDataToNormalize, normalizeProfile } from "./normalizer";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const FETCH_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 4_000_000; // real profile pages run ~0.5-1MB; this is generous headroom, not a target

/**
 * Retrieves a public Instagram profile by fetching and parsing
 * `https://www.instagram.com/<username>/` as any anonymous, logged-out
 * visitor would see it — no login, no session cookies, no bypass of any
 * access control. It never attempts to retrieve Stories: Instagram does
 * not expose Story media through this or any other unauthenticated
 * surface, confirmed by direct inspection (see
 * docs/story-retrieval-limitations.md), so `Profile.stories` is always `[]`.
 *
 * Important: Instagram's robots.txt explicitly states that automated
 * collection is disallowed without express written permission, and its
 * `Disallow: /` default rule blocks unrecognized automated agents
 * site-wide. This class does not attempt to evade that — it identifies
 * itself honestly and does not spoof a browser or an allow-listed bot —
 * but running it in production is a deliberate, informed decision to
 * proceed despite that policy, made by this project's owner. See
 * docs/story-retrieval-limitations.md before deploying this.
 */
export class PublicWebStoryProvider implements StoryProvider {
  async getProfile(usernameInput: string): Promise<Profile | null> {
    const { valid, normalized } = validateUsername(usernameInput);
    if (!valid) {
      // Defense in depth only — callers (lookup.ts) already validate
      // before reaching the provider, so this should never actually fire.
      throw new ProviderError("Invalid username.", "UPSTREAM_ERROR");
    }

    if (!checkOutboundRateLimit().allowed) {
      throw new ProviderError(
        "Upstream request budget exceeded for this window.",
        "RATE_LIMITED",
      );
    }

    // URL is always built from a strictly-validated, letters/numbers/./_
    // only username segment — never from a client-supplied URL. This is
    // the project's SSRF boundary; see validation.ts.
    const targetUrl = `https://www.instagram.com/${normalized}/`;

    let response: Response;
    let html: string;
    try {
      response = await this.fetchWithTimeout(targetUrl);
      html = await this.readBodyWithLimit(response);
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      const isTimeout = err instanceof Error && err.name === "AbortError";
      throw new ProviderError(
        isTimeout ? "Timed out reaching the public profile page." : "Failed to reach the public profile page.",
        isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR",
        err,
      );
    }

    if (response.status === 404) return null;

    if (!response.ok) {
      throw new ProviderError(
        "Public profile page returned an unexpected status.",
        "UPSTREAM_ERROR",
        `status=${response.status}`,
      );
    }

    if (looksLikeAccessBlocked(response.url, html)) {
      throw new ProviderError(
        "Instagram served a login/checkpoint wall instead of the public profile.",
        "CONTENT_UNAVAILABLE",
      );
    }

    const raw = parseProfilePage(html);

    if (!hasEnoughDataToNormalize(raw)) {
      throw new ProviderError(
        "Could not confirm public/private status from the retrieved page — Instagram's markup may have changed.",
        "CONTENT_UNAVAILABLE",
      );
    }

    return normalizeProfile(raw, normalized);
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      return await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        cache: "no-store",
        headers: {
          // Standard bot self-identification format (the same convention
          // Googlebot/Bingbot use) — this declares what it is, it does not
          // claim to be a browser.
          "User-Agent": `Mozilla/5.0 (compatible; ${SITE_NAME}/1.0; +${SITE_URL}/about/)`,
          Accept: "text/html",
        },
      });
    } finally {
      clearTimeout(timer);
    }
  }

  private async readBodyWithLimit(response: Response): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) return response.text();

    const decoder = new TextDecoder();
    let received = 0;
    let text = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new ProviderError(
          "Public profile page exceeded the response size limit.",
          "UPSTREAM_ERROR",
        );
      }
      text += decoder.decode(value, { stream: true });
    }

    return text;
  }
}
