import { getProvider, ProviderError } from "./index";
import { validateUsername } from "./validation";
import { getCached, setCached } from "./cache";
import type { StoryLookupResult, StoryErrorCode } from "@/types/story";
import type { PostsLookupResult, PostsErrorCode } from "@/types/post";

/**
 * Posts are fetched separately from `lookupStory` — a distinct, separately
 * billed HikerAPI call the UI only needs when the Posts tab is opened. To
 * avoid a redundant profile fetch, this reuses the `story-lookup:<username>`
 * cache entry (already populated by a prior `/api/story-viewer` call in the
 * normal UI flow) to resolve not_found/private without hitting the
 * provider again; only falls back to a fresh `getProfile` call when that
 * cache is empty (e.g. a direct API call that skipped the story lookup).
 */
export async function lookupPosts(usernameInput: unknown): Promise<PostsLookupResult> {
  const { valid, normalized, error } = validateUsername(usernameInput);
  if (!valid) {
    return { status: "error", code: "INVALID_USERNAME", message: error ?? "Invalid username." };
  }

  const cacheKey = `posts-lookup:${normalized}`;
  const cached = getCached<PostsLookupResult>(cacheKey);
  if (cached) return cached;

  const provider = getProvider();
  if (!provider.getPosts) {
    return {
      status: "error",
      code: "NOT_SUPPORTED",
      message: "Post retrieval isn't available right now.",
    };
  }

  try {
    const storyCacheKey = `story-lookup:${normalized}`;
    const storyResult = getCached<StoryLookupResult>(storyCacheKey);

    if (storyResult?.status === "not_found") {
      const result: PostsLookupResult = { status: "not_found", username: normalized };
      setCached(cacheKey, result, 60_000);
      return result;
    }

    if (storyResult?.status === "private") {
      const result: PostsLookupResult = { status: "private", username: normalized };
      setCached(cacheKey, result, 10 * 60_000);
      return result;
    }

    if (!storyResult || storyResult.status === "error") {
      const profile = await provider.getProfile(normalized);
      if (!profile) {
        const result: PostsLookupResult = { status: "not_found", username: normalized };
        setCached(cacheKey, result, 60_000);
        return result;
      }
      if (!profile.isPublic) {
        const result: PostsLookupResult = { status: "private", username: normalized };
        setCached(cacheKey, result, 10 * 60_000);
        return result;
      }
    }

    const posts = await provider.getPosts(normalized);
    const result: PostsLookupResult = { status: "ok", posts };
    setCached(cacheKey, result, 60_000);
    return result;
  } catch (err) {
    if (err instanceof ProviderError) {
      console.error("[posts-lookup] provider error:", err.code, err.message, err.detail);
      return { status: "error", code: err.code, message: errorMessageForCode(err.code) };
    }
    console.error("[posts-lookup] unexpected error:", err);
    return { status: "error", code: "UPSTREAM_ERROR", message: errorMessageForCode("UPSTREAM_ERROR") };
  }
}

function errorMessageForCode(code: StoryErrorCode | PostsErrorCode): string {
  switch (code) {
    case "UPSTREAM_TIMEOUT":
      return "The request took too long. Please try again in a moment.";
    case "RATE_LIMITED":
      return "Too many requests right now. Please wait a moment and try again.";
    default:
      return "We couldn't retrieve posts right now. Please try again later.";
  }
}
