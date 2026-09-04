import { getProvider, ProviderError } from "./index";
import { getCached, setCached } from "./cache";
import type { PostLookupResult, PostsErrorCode } from "@/types/post";

export async function lookupPostByShortcode(shortcode: string): Promise<PostLookupResult> {
  const cacheKey = `post-lookup:${shortcode}`;
  const cached = getCached<PostLookupResult>(cacheKey);
  if (cached) return cached;

  const provider = getProvider();
  if (!provider.getPostByShortcode) {
    return {
      status: "error",
      code: "NOT_SUPPORTED",
      message: "Post lookup by URL isn't available right now.",
    };
  }

  try {
    const post = await provider.getPostByShortcode(shortcode);
    const result: PostLookupResult = post ? { status: "ok", post } : { status: "not_found" };
    setCached(cacheKey, result, 60_000);
    return result;
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
