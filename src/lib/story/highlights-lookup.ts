import { getProvider, ProviderError } from "./index";
import { validateUsername } from "./validation";
import { getCached, setCached } from "./cache";
import type { StoryLookupResult, StoryErrorCode } from "@/types/story";
import type { HighlightsLookupResult, HighlightsErrorCode } from "@/types/highlight";

/**
 * A username's highlight tray (cover + title per highlight). Mirrors
 * `posts-lookup.ts`: reuses the `story-lookup:<username>` cache entry to
 * resolve not_found/private without an extra provider call, and falls
 * back to a fresh `getBasicProfile` (not `getProfile` — no need to pay
 * for a stories fetch here) only when that cache is empty.
 */
export async function lookupHighlights(usernameInput: unknown): Promise<HighlightsLookupResult> {
  const { valid, normalized, error } = validateUsername(usernameInput);
  if (!valid) {
    return { status: "error", code: "INVALID_USERNAME", message: error ?? "Invalid username." };
  }

  const cacheKey = `highlights-lookup:${normalized}`;
  const cached = getCached<HighlightsLookupResult>(cacheKey);
  if (cached) return cached;

  const provider = getProvider();
  if (!provider.getHighlights) {
    return {
      status: "error",
      code: "NOT_SUPPORTED",
      message: "Highlight retrieval isn't available right now.",
    };
  }

  try {
    const storyCacheKey = `story-lookup:${normalized}`;
    const storyResult = getCached<StoryLookupResult>(storyCacheKey);

    if (storyResult?.status === "not_found") {
      const result: HighlightsLookupResult = { status: "not_found", username: normalized };
      setCached(cacheKey, result, 60_000);
      return result;
    }

    if (storyResult?.status === "private") {
      const result: HighlightsLookupResult = { status: "private", username: normalized };
      setCached(cacheKey, result, 10 * 60_000);
      return result;
    }

    if (!storyResult || storyResult.status === "error") {
      const fetchProfile = provider.getBasicProfile?.bind(provider) ?? provider.getProfile.bind(provider);
      const profile = await fetchProfile(normalized);
      if (!profile) {
        const result: HighlightsLookupResult = { status: "not_found", username: normalized };
        setCached(cacheKey, result, 60_000);
        return result;
      }
      if (!profile.isPublic) {
        const result: HighlightsLookupResult = { status: "private", username: normalized };
        setCached(cacheKey, result, 10 * 60_000);
        return result;
      }
    }

    const highlights = await provider.getHighlights(normalized);
    const result: HighlightsLookupResult = { status: "ok", highlights };
    setCached(cacheKey, result, 60_000);
    return result;
  } catch (err) {
    if (err instanceof ProviderError) {
      console.error("[highlights-lookup] provider error:", err.code, err.message, err.detail);
      return { status: "error", code: err.code, message: errorMessageForCode(err.code) };
    }
    console.error("[highlights-lookup] unexpected error:", err);
    return { status: "error", code: "UPSTREAM_ERROR", message: errorMessageForCode("UPSTREAM_ERROR") };
  }
}

function errorMessageForCode(code: StoryErrorCode | HighlightsErrorCode): string {
  switch (code) {
    case "UPSTREAM_TIMEOUT":
      return "The request took too long. Please try again in a moment.";
    case "RATE_LIMITED":
      return "Too many requests right now. Please wait a moment and try again.";
    default:
      return "We couldn't retrieve highlights right now. Please try again later.";
  }
}
