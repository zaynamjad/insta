import { getHybridConfig } from "./hybrid-config";
import { cachedLoad } from "./shared-cache";
import type { StoryProvider } from "./provider";
import type { Profile } from "@/types/profile";
import type { Story } from "@/types/story";
import type { Post } from "@/types/post";

/** Shared by every lookup (stories, posts, highlights, single items): TTL rules and the cached profile entry. */

/** Seconds before a signed media URL's expiry at which we stop serving it from cache. */
const EXPIRY_SAFETY_MARGIN_S = 300;

/** Instagram's CDN URLs carry `oe=<hex unix seconds>`: the moment the signature stops working. */
export function mediaUrlExpiry(url: string | null | undefined): number | null {
  if (!url) return null;
  try {
    const oe = new URL(url).searchParams.get("oe");
    if (!oe || !/^[0-9a-f]{6,10}$/i.test(oe)) return null;
    return parseInt(oe, 16);
  } catch {
    return null;
  }
}

/**
 * Caps `ttlSeconds` so cached data never outlives the media URLs inside it.
 * Returns 0 (don't cache) if a URL is already within the safety margin of
 * expiring — serving it would hand the visitor a dead link.
 */
export function boundTtlByMedia(ttlSeconds: number, urls: (string | null | undefined)[], now = Date.now()): number {
  let ttl = ttlSeconds;
  for (const url of urls) {
    const expiry = mediaUrlExpiry(url);
    if (expiry === null) continue;
    ttl = Math.min(ttl, Math.floor(expiry - now / 1000 - EXPIRY_SAFETY_MARGIN_S));
  }
  return Math.max(0, ttl);
}

export const profileUrls = (p: Profile) => [p.profileImage, p.profileImageHd];
export const storyUrls = (stories: Story[]) => stories.flatMap((s) => [s.mediaUrl, s.thumbnailUrl]);
export const postUrls = (posts: Post[]) => posts.flatMap((p) => p.items.flatMap((i) => [i.mediaUrl, i.thumbnailUrl]));

export interface ProfileEntry {
  /** null = the profile does not exist. */
  profile: Profile | null;
}

/**
 * The profile metadata for a username, from the shared cache or one provider
 * call (`getBasicProfile` when the provider has it, so no Stories are bought
 * just to learn whether the profile is public). Cached for the profile TTL —
 * long, because bio/counts change slowly — with shorter lifetimes for "not
 * found" and private answers. A provider error throws and is never cached.
 */
export function loadProfileEntry(provider: StoryProvider, username: string): Promise<ProfileEntry> {
  return cachedLoad<ProfileEntry>({
    feature: "profile",
    key: `profile:v1:${username}`,
    load: async () => {
      const fetchProfile = provider.getBasicProfile?.bind(provider) ?? provider.getProfile.bind(provider);
      return { profile: await fetchProfile(username) };
    },
    ttlSeconds: (entry) => {
      const { ttl } = getHybridConfig();
      if (!entry.profile) return ttl.negativeS;
      if (!entry.profile.isPublic) return ttl.shortS;
      return boundTtlByMedia(ttl.profileS, profileUrls(entry.profile));
    },
  });
}

/** The profile as sent to the browser: the internal user id stays server-side. */
export function publicProfile(profile: Profile, stories: Story[]): Profile {
  const copy: Profile = { ...profile, stories };
  delete copy.userId;
  return copy;
}
