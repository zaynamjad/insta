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

// Optional: routes the fetch below through Scrapfly's managed anti-bot Web
// Scraping API instead of a raw fetch, when Instagram's bot detection blocks
// direct requests (see docs/story-retrieval-limitations.md). This changes
// nothing about *what* is fetched — still the same public, unauthenticated
// profile page, no login, no session — only *how* the HTTP request itself
// gets past bot detection. Falls back to the direct fetch below when unset.
const SCRAPFLY_API_KEY = process.env.SCRAPFLY_API_KEY;
const SCRAPFLY_ENDPOINT = "https://api.scrapfly.io/scrape";
const SCRAPFLY_TIMEOUT_MS = 20_000; // anti-bot challenge solving is slower than a plain fetch

interface FetchedPage {
  status: number;
  finalUrl: string;
  html: string;
}

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
 *
 * When `SCRAPFLY_API_KEY` is set, the fetch is routed through Scrapfly's
 * managed anti-bot Web Scraping API instead of a raw `fetch()`, since
 * Instagram's bot detection reliably blocks direct requests in production.
 * The target and the data retrieved are identical either way — still the
 * same public, unauthenticated page, still never Stories.
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

    let page: FetchedPage;
    try {
      page = SCRAPFLY_API_KEY
        ? await this.fetchViaScrapfly(targetUrl)
        : await this.fetchDirect(targetUrl);
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      const isTimeout = err instanceof Error && err.name === "AbortError";
      throw new ProviderError(
        isTimeout ? "Timed out reaching the public profile page." : "Failed to reach the public profile page.",
        isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR",
        err,
      );
    }

    if (page.status === 404) return null;

    if (page.status < 200 || page.status >= 300) {
      throw new ProviderError(
        "Public profile page returned an unexpected status.",
        "UPSTREAM_ERROR",
        `status=${page.status}`,
      );
    }

    if (looksLikeAccessBlocked(page.finalUrl, page.html)) {
      throw new ProviderError(
        "Instagram served a login/checkpoint wall instead of the public profile.",
        "CONTENT_UNAVAILABLE",
      );
    }

    const raw = parseProfilePage(page.html);

    if (!hasEnoughDataToNormalize(raw)) {
      throw new ProviderError(
        "Could not confirm public/private status from the retrieved page — Instagram's markup may have changed.",
        "CONTENT_UNAVAILABLE",
      );
    }

    return normalizeProfile(raw, normalized);
  }

  private async fetchDirect(url: string): Promise<FetchedPage> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(url, {
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

    const html = await this.readBodyWithLimit(response);
    return { status: response.status, finalUrl: response.url, html };
  }

  /**
   * Same public profile page as `fetchDirect`, retrieved through Scrapfly's
   * Web Scraping API (`asp=true`) instead of a direct fetch, so Instagram's
   * bot detection doesn't block the request before it reaches our parser.
   */
  private async fetchViaScrapfly(url: string): Promise<FetchedPage> {
    const apiUrl = `${SCRAPFLY_ENDPOINT}?key=${SCRAPFLY_API_KEY}&url=${encodeURIComponent(url)}&asp=true&country=us`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SCRAPFLY_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(apiUrl, { signal: controller.signal, cache: "no-store" });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new ProviderError(
        "Anti-bot fetch service returned an unexpected status.",
        "UPSTREAM_ERROR",
        `status=${response.status}`,
      );
    }

    const body = (await response.json()) as {
      result?: { status_code: number; url: string; content: string; size: number };
    };
    const result = body.result;
    if (!result || typeof result.content !== "string") {
      throw new ProviderError(
        "Anti-bot fetch service returned an unexpected response shape.",
        "UPSTREAM_ERROR",
      );
    }

    if (result.size > MAX_RESPONSE_BYTES) {
      throw new ProviderError(
        "Public profile page exceeded the response size limit.",
        "UPSTREAM_ERROR",
      );
    }

    return { status: result.status_code, finalUrl: result.url, html: result.content };
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
