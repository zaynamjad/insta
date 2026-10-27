import { getProvider, ProviderError } from "./index";
import { cachedLoad } from "./shared-cache";
import { getHybridConfig } from "./hybrid-config";
import { boundTtlByMedia, postUrls } from "./lookup-support";
import type { PostLookupResult, PostsErrorCode } from "@/types/post";

export async function lookupPostByShortcode(shortcode: string): Promise<PostLookupResult> {
  try {
    const provider = await getProvider();
    if (!provider.getPostByShortcode) {
      return {
        status: "error",
        code: "NOT_SUPPORTED",
        message: "Post lookup by URL isn't available right now.",
      };
    }

    return await cachedLoad<PostLookupResult>({
      feature: "media",
      key: `post-lookup:v1:${shortcode}`,
      load: async () => {
        const post = await provider.getPostByShortcode!(shortcode);
        return post ? { status: "ok", post } : { status: "not_found" };
      },
      ttlSeconds: (result) => {
        const { ttl } = getHybridConfig();
        if (result.status === "ok") return boundTtlByMedia(ttl.mediaS, postUrls([result.post]));
        return result.status === "not_found" ? ttl.negativeS : 0;
      },
    });
  } catch (err) {
    if (err instanceof ProviderError) {
      console.error("[post-lookup] provider error:", err.code, err.message, err.detail);
      return { status: "error", code: err.code, message: errorMessageForCode(err.code) };
    }
    console.error("[post-lookup] unexpected error:", err);
    return { status: "error", code: "UPSTREAM_ERROR", message: errorMessageForCode("UPSTREAM_ERROR") };
  }
}

function errorMessageForCode(code: PostsErrorCode): string {
  switch (code) {
    case "UPSTREAM_TIMEOUT":
      return "The request took too long. Please try again in a moment.";
    case "RATE_LIMITED":
      return "Too many requests right now. Please wait a moment and try again.";
    default:
      return "We couldn't retrieve this post right now. Please try again later.";
  }
}
