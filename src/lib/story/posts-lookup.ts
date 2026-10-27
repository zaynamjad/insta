import { getProvider, ProviderError } from "./index";
import { validateUsername } from "./validation";
import { cachedLoad } from "./shared-cache";
import { getHybridConfig } from "./hybrid-config";
import { boundTtlByMedia, loadProfileEntry, postUrls } from "./lookup-support";
import type { StoryErrorCode } from "@/types/story";
import type { PostsLookupResult, PostsErrorCode } from "@/types/post";

/**
 * Posts (and Reels — the UI filters one combined list by `isReel`) are fetched
 * separately from `lookupStory`, only when the Posts/Reels tab is opened.
 *
 * Profile public/private/not-found comes from the shared cached profile entry
 * (already populated by the main search in the normal flow), and the user id
 * from that entry lets the provider skip its own username lookup. An empty
 * list is cached only briefly unless the profile is known to have no posts:
 * a provider that reports "nothing" after a failed or ambiguous fetch must not
 * be believed for 30 minutes.
 */
export async function lookupPosts(usernameInput: unknown): Promise<PostsLookupResult> {
  const { valid, normalized, error } = validateUsername(usernameInput);
  if (!valid) {
    return { status: "error", code: "INVALID_USERNAME", message: error ?? "Invalid username." };
  }

  try {
    const provider = await getProvider();
    if (!provider.getPosts) {
      return {
        status: "error",
        code: "NOT_SUPPORTED",
        message: "Post retrieval isn't available right now.",
      };
    }

    return await cachedLoad<PostsLookupResult>({
      feature: "posts",
      key: `posts:v1:${normalized}`,
      load: async () => {
        const { profile } = await loadProfileEntry(provider, normalized);
        if (!profile) return { status: "not_found", username: normalized };
        if (!profile.isPublic) return { status: "private", username: normalized };
        // The profile already says there is nothing to list — no provider call (and no credit) needed.
        if (profile.posts === 0) return { status: "ok", posts: [] };

        const posts = await provider.getPosts!(normalized, { userId: profile.userId });
        return { status: "ok", posts };
      },
      ttlSeconds: (result) => {
        const { ttl } = getHybridConfig();
        if (result.status === "not_found") return ttl.negativeS;
        if (result.status === "private") return ttl.shortS;
        if (result.status === "error") return 0;
        return result.posts.length === 0 ? ttl.negativeS : boundTtlByMedia(ttl.postsS, postUrls(result.posts));
      },
    });
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
