import { getProvider, ProviderError } from "./index";
import { cachedLoad } from "./shared-cache";
import { getHybridConfig } from "./hybrid-config";
import { boundTtlByMedia, storyUrls } from "./lookup-support";
import type { HighlightItemsLookupResult, HighlightsErrorCode } from "@/types/highlight";

/** A single highlight's story items, by its public Instagram URL — used both for a clicked tray item and a pasted highlight link. */
export async function lookupHighlightItems(highlightUrl: string): Promise<HighlightItemsLookupResult> {
  try {
    const provider = await getProvider();
    if (!provider.getHighlightItems) {
      return {
        status: "error",
        code: "NOT_SUPPORTED",
        message: "Highlight lookup by URL isn't available right now.",
      };
    }

    return await cachedLoad<HighlightItemsLookupResult>({
      feature: "media",
      key: `highlight-lookup:v1:${highlightUrl}`,
      load: async () => {
        const detail = await provider.getHighlightItems!(highlightUrl);
        return detail
          ? { status: "ok", title: detail.title, coverImageUrl: detail.coverImageUrl, items: detail.items }
          : { status: "not_found" };
      },
      ttlSeconds: (result) => {
        const { ttl } = getHybridConfig();
        if (result.status === "ok") {
          return boundTtlByMedia(ttl.mediaS, [result.coverImageUrl, ...storyUrls(result.items)]);
        }
        return result.status === "not_found" ? ttl.negativeS : 0;
      },
    });
  } catch (err) {
    if (err instanceof ProviderError) {
      console.error("[highlight-lookup] provider error:", err.code, err.message, err.detail);
      return { status: "error", code: err.code, message: errorMessageForCode(err.code) };
    }
    console.error("[highlight-lookup] unexpected error:", err);
    return { status: "error", code: "UPSTREAM_ERROR", message: errorMessageForCode("UPSTREAM_ERROR") };
  }
}

function errorMessageForCode(code: HighlightsErrorCode): string {
  switch (code) {
    case "UPSTREAM_TIMEOUT":
      return "The request took too long. Please try again in a moment.";
    case "RATE_LIMITED":
      return "Too many requests right now. Please wait a moment and try again.";
    default:
      return "We couldn't retrieve this highlight right now. Please try again later.";
  }
}
