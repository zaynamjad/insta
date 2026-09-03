import type { Profile } from "@/types/profile";
import type { RawProfileData } from "./parser";

/**
 * True only when we have enough genuinely-extracted signal to build a
 * trustworthy `Profile` — specifically, a confirmed `isPrivate` value.
 * Everything else on `Profile` is allowed to be `null` (we show whatever
 * we found), but public/private status is the one field we refuse to
 * guess: showing a private account as if it were confirmed-public (or
 * vice versa) would be worse than an honest "couldn't retrieve" error.
 */
export function hasEnoughDataToNormalize(raw: RawProfileData): boolean {
  return raw.isPrivate !== null;
}

/** Parses "1.2M Followers, 300 Following, 500 Posts - ..." as a last-resort fallback when the embedded JSON record wasn't found. */
export function parseCountsFromOgDescription(description: string | null): {
  followers: number | null;
  following: number | null;
  posts: number | null;
} {
  if (!description) return { followers: null, following: null, posts: null };

  const parse = (label: string): number | null => {
    const match = description.match(
      new RegExp(`([\\d,.]+)\\s*([KMB]?)\\s*${label}`, "i"),
    );
    if (!match) return null;
    const [, numStr, suffix] = match;
    const base = parseFloat(numStr.replace(/,/g, ""));
    if (Number.isNaN(base)) return null;
    const multiplier = { K: 1_000, M: 1_000_000, B: 1_000_000_000 }[suffix.toUpperCase()] ?? 1;
    return Math.round(base * multiplier);
  };

  return {
    followers: parse("Followers"),
    following: parse("Following"),
    posts: parse("Posts"),
  };
}

export function normalizeProfile(raw: RawProfileData, username: string): Profile {
  const ogCounts = parseCountsFromOgDescription(raw.ogDescription);

  return {
    username,
    profileImage: raw.profilePicUrl ?? raw.ogImage ?? null,
    fullName: raw.fullName ?? extractNameFromOgTitle(raw.ogTitle),
    bio: raw.biography,
    followers: raw.followerCount ?? ogCounts.followers,
    following: raw.followingCount ?? ogCounts.following,
    posts: raw.postCount ?? ogCounts.posts,
    isVerified: raw.isVerified ?? false,
    isPublic: raw.isPrivate === false,
    stories: [],
    category: null,
    externalUrl: null,
  };
}

function extractNameFromOgTitle(ogTitle: string | null): string | null {
  if (!ogTitle) return null;
  const match = ogTitle.match(/^(.*?)\s*\(@/);
  return match ? match[1].trim() : null;
}
