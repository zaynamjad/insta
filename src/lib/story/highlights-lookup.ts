import { getProvider, ProviderError } from "./index";
import { validateUsername } from "./validation";
import { cachedLoad } from "./shared-cache";
import { getHybridConfig } from "./hybrid-config";
import { boundTtlByMedia, loadProfileEntry } from "./lookup-support";
import type { StoryErrorCode } from "@/types/story";
import type { HighlightsLookupResult, HighlightsErrorCode } from "@/types/highlight";

/**
 * A username's highlight tray (cover + title per highlight). Mirrors
 * `posts-lookup.ts`: the shared cached profile entry resolves
 * not_found/private and supplies the user id, so the provider doesn't
 * re-resolve the username (a billed call on HikerAPI, which also bills
 * the tray itself at 2 units). Highlights rarely change, hence the long TTL.
 */
export async function lookupHighlights(usernameInput: unknown): Promise<HighlightsLookupResult> {
  const { valid, normalized, error } = validateUsername(usernameInput);
  if (!valid) {
    return { status: "error", code: "INVALID_USERNAME", message: error ?? "Invalid username." };
  }

  try {
    const provider = await getProvider();
    if (!provider.getHighlights) {
      return {
        status: "error",
        code: "NOT_SUPPORTED",
        message: "Highlight retrieval isn't available right now.",
      };
    }

    return await cachedLoad<HighlightsLookupResult>({
      feature: "highlights",
      key: `highlights:v1:${normalized}`,
      load: async () => {
        const { profile } = await loadProfileEntry(provider, normalized);
        if (!profile) return { status: "not_found", username: normalized };
        if (!profile.isPublic) return { status: "private", username: normalized };

        const highlights = await provider.getHighlights!(normalized, { userId: profile.userId });
        return { status: "ok", highlights };
      },
      ttlSeconds: (result) => {
        const { ttl } = getHybridConfig();
        if (result.status === "not_found") return ttl.negativeS;
        if (result.status === "private") return ttl.shortS;
        if (result.status === "error") return 0;
        // A short life for an empty tray: many accounts have none, but an empty answer from a
        // flaky provider shouldn't stick for hours.
        return result.highlights.length === 0
          ? ttl.shortS
          : boundTtlByMedia(ttl.highlightsS, result.highlights.map((h) => h.coverImageUrl));
      },
    });
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
