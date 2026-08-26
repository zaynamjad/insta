import { getProvider, ProviderError } from "./index";
import { validateUsername } from "./validation";
import { getCached, setCached } from "./cache";
import type { StoryLookupResult, StoryErrorCode } from "@/types/story";

/**
 * Shared entry point for resolving a username to a `StoryLookupResult` —
 * used by both `/api/story-viewer` and `/profile/[username]` so a lookup
 * triggered from either surface shares the same cache entry and never
 * fetches Instagram twice for the same username within the TTL.
 *
 * Always resolves (never throws): retrieval failures come back as
 * `{ status: "error" }` rather than propagating, since both callers need
 * a result object either way.
 */
export async function lookupStory(usernameInput: unknown): Promise<StoryLookupResult> {
  const { valid, normalized, error } = validateUsername(usernameInput);
  if (!valid) {
    return { status: "error", code: "INVALID_USERNAME", message: error ?? "Invalid username." };
  }

  const cacheKey = `story-lookup:${normalized}`;
  const cached = getCached<StoryLookupResult>(cacheKey);
  if (cached) return cached;

  try {
    const provider = getProvider();
    const profile = await provider.getProfile(normalized);

    if (!profile) {
      const result: StoryLookupResult = { status: "not_found", username: normalized };
      setCached(cacheKey, result, 60_000);
      return result;
    }

    if (!profile.isPublic) {
      const result: StoryLookupResult = { status: "private", profile };
      setCached(cacheKey, result, 10 * 60_000);
      return result;
    }

    const result: StoryLookupResult =
      profile.stories.length === 0
        ? { status: "no_stories", profile }
        : { status: "ok", profile };

    setCached(cacheKey, result, 60_000);
    return result;
  } catch (err) {
    if (err instanceof ProviderError) {
      console.error("[story-lookup] provider error:", err.code, err.message, err.detail);
      return { status: "error", code: err.code, message: errorMessageForCode(err.code) };
    }
    console.error("[story-lookup] unexpected error:", err);
    return {
      status: "error",
      code: "UPSTREAM_ERROR",
      message: errorMessageForCode("UPSTREAM_ERROR"),
    };
  }
}

function errorMessageForCode(code: StoryErrorCode): string {
  switch (code) {
    case "UPSTREAM_TIMEOUT":
      return "Instagram took too long to respond. Please try again in a moment.";
    case "RATE_LIMITED":
      return "Too many requests right now. Please wait a moment and try again.";
    case "CONTENT_UNAVAILABLE":
    case "UPSTREAM_ERROR":
    default:
      return "We couldn't retrieve public content right now. Please try again later.";
  }
}
