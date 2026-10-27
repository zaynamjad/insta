import { getProvider, ProviderError } from "./index";
import type { StoryProvider } from "./provider";
import { validateUsername } from "./validation";
import { cachedLoad } from "./shared-cache";
import { getHybridConfig } from "./hybrid-config";
import { boundTtlByMedia, loadProfileEntry, publicProfile, storyUrls } from "./lookup-support";
import type { StoryLookupResult, StoryErrorCode, Story } from "@/types/story";

/**
 * Shared entry point for resolving a username to a `StoryLookupResult` —
 * used by both `/api/story-viewer` and `/profile/[username]`, so a lookup
 * from either surface shares the same Redis cache entries and never fetches
 * a provider twice for the same data within its TTL.
 *
 * The lookup is two independently cached pieces, because they age very
 * differently and are billed very differently:
 *
 *   1. Profile metadata (long TTL) — cheap, and shared with the Posts and
 *      Highlights tabs. Carries the numeric user id.
 *   2. Active Stories (short TTL) — fetched only for a public profile, and by
 *      user id, so the Stories call doesn't first re-buy a username lookup.
 *
 * A provider with no separate Stories source (the public-web fallback) keeps
 * the original one-shot `getProfile` path.
 *
 * Always resolves (never throws): retrieval failures come back as
 * `{ status: "error" }` and are never cached.
 */
export async function lookupStory(usernameInput: unknown): Promise<StoryLookupResult> {
  const { valid, normalized, error } = validateUsername(usernameInput);
  if (!valid) {
    return { status: "error", code: "INVALID_USERNAME", message: error ?? "Invalid username." };
  }

  try {
    const provider = await getProvider();
    return provider.getStories ? await lookupSplit(provider, normalized) : await lookupLegacy(provider, normalized);
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

async function lookupSplit(provider: StoryProvider, username: string): Promise<StoryLookupResult> {
  const { profile } = await loadProfileEntry(provider, username);
  if (!profile) return { status: "not_found", username };
  if (!profile.isPublic) return { status: "private", profile: publicProfile(profile, []) };

  const stories = await cachedLoad<Story[]>({
    feature: "stories",
    key: `stories:v1:${username}`,
    load: () => provider.getStories!(username, { userId: profile.userId }),
    ttlSeconds: (list) => boundTtlByMedia(getHybridConfig().ttl.storiesS, storyUrls(list)),
  });

  return stories.length === 0
    ? { status: "no_stories", profile: publicProfile(profile, []) }
    : { status: "ok", profile: publicProfile(profile, stories) };
}

async function lookupLegacy(provider: StoryProvider, username: string): Promise<StoryLookupResult> {
  const { ttl } = getHybridConfig();
  return cachedLoad<StoryLookupResult>({
    feature: "story",
    key: `story-lookup:v1:${username}`,
    load: async () => {
      const profile = await provider.getProfile(username);
      if (!profile) return { status: "not_found", username };
      if (!profile.isPublic) return { status: "private", profile: publicProfile(profile, []) };
      return profile.stories.length === 0
        ? { status: "no_stories", profile: publicProfile(profile, []) }
        : { status: "ok", profile: publicProfile(profile, profile.stories) };
    },
    ttlSeconds: (result) =>
      result.status === "not_found"
        ? ttl.negativeS
        : result.status === "private"
          ? ttl.shortS
          : result.status === "error"
            ? 0
            : boundTtlByMedia(ttl.storiesS, result.status === "ok" ? storyUrls(result.profile.stories) : []),
  });
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
