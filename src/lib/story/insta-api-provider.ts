import type { StoryProvider } from "./provider";
import { ProviderError } from "./provider";
import type { Profile } from "@/types/profile";
import { validateUsername } from "./validation";
import { checkOutboundRateLimit } from "./rate-limit";

const INSTA_API_URL = process.env.INSTA_API_URL;
const INSTA_API_SECRET = process.env.INSTA_API_SECRET ?? "";
const FETCH_TIMEOUT_MS = 55_000; // Render free tier cold-starts can take 30s+ before the request even begins

/**
 * Story provider that delegates to the FastAPI Instaloader backend.
 *
 * Unlike `PublicWebStoryProvider` (which can only see profile metadata),
 * this provider calls an authenticated Instaloader session behind a
 * FastAPI server, so it **can** return actual Story media URLs.
 *
 * Falls back cleanly when the API is unreachable — the caller
 * (`lookup.ts`) handles the `ProviderError` and shows an appropriate
 * user-facing message.
 */
export class InstaApiProvider implements StoryProvider {
  async getProfile(usernameInput: string): Promise<Profile | null> {
    const { valid, normalized } = validateUsername(usernameInput);
    if (!valid) {
      throw new ProviderError("Invalid username.", "UPSTREAM_ERROR");
    }

    if (!checkOutboundRateLimit().allowed) {
      throw new ProviderError(
        "Upstream request budget exceeded for this window.",
        "RATE_LIMITED",
      );
    }

    if (!INSTA_API_URL) {
      throw new ProviderError(
        "INSTA_API_URL is not configured.",
        "UPSTREAM_ERROR",
      );
    }

    const url = `${INSTA_API_URL}/api/stories/${encodeURIComponent(normalized)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${INSTA_API_SECRET}`,
          Accept: "application/json",
        },
      });
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      throw new ProviderError(
        isTimeout
          ? "Story API timed out."
          : "Failed to reach the story API.",
        isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR",
        err,
      );
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 401) {
      throw new ProviderError(
        "Story API authentication failed.",
        "UPSTREAM_ERROR",
        "401 Unauthorized",
      );
    }

    if (response.status === 429) {
      throw new ProviderError(
        "Rate limited by Instagram. Please try again later.",
        "RATE_LIMITED",
      );
    }

    if (response.status === 503) {
      throw new ProviderError(
        "Story API session expired.",
        "UPSTREAM_ERROR",
        "503 Session expired",
      );
    }

    if (!response.ok) {
      throw new ProviderError(
        "Story API returned an unexpected status.",
        "UPSTREAM_ERROR",
        `status=${response.status}`,
      );
    }

    const data = (await response.json()) as {
      status: string;
      username?: string;
      profile?: Profile;
    };

    // Profile not found
    if (data.status === "not_found") {
      return null;
    }

    // Private or has profile data
    if (data.profile) {
      return data.profile;
    }

    // Unexpected shape
    throw new ProviderError(
      "Story API returned an unexpected response shape.",
      "UPSTREAM_ERROR",
    );
  }
}
