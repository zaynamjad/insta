import { getStoredFeaturedProfiles } from "./featured-profiles-store";
import type { Profile } from "@/types/profile";

export interface FeaturedProfileMeta {
  username: string;
  displayName: string;
  category: string;
  country: string | null;
  /** Shown until (or unless) the permanent store has real data for this account. */
  fallbackFollowers: string;
}

export interface FeaturedProfile {
  meta: FeaturedProfileMeta;
  /** null when the permanent store has no entry yet — callers fall back to `meta`. */
  profile: Profile | null;
}

const FEATURED_META: FeaturedProfileMeta[] = [
  { username: "natgeo", displayName: "National Geographic", category: "Magazine and media brand", country: "United States", fallbackFollowers: "270M" },
  { username: "nike", displayName: "Nike", category: "Sportswear multinational", country: "United States", fallbackFollowers: "305M" },
  { username: "youtube", displayName: "YouTube", category: "Video platform", country: "United States", fallbackFollowers: "85M" },
  { username: "nba", displayName: "NBA", category: "Basketball league", country: "United States", fallbackFollowers: "85M" },
  { username: "nasa", displayName: "NASA", category: "Space agency", country: "United States", fallbackFollowers: "120M" },
  { username: "netflix", displayName: "Netflix", category: "Streaming entertainment", country: "United States", fallbackFollowers: "40M" },
  { username: "samsung", displayName: "Samsung", category: "Electronics multinational", country: "South Korea", fallbackFollowers: "35M" },
  { username: "espn", displayName: "ESPN", category: "Sports media network", country: "United States", fallbackFollowers: "50M" },
  { username: "marvel", displayName: "Marvel", category: "Entertainment and comics brand", country: "United States", fallbackFollowers: "60M" },
  { username: "cnn", displayName: "CNN", category: "News network", country: "United States", fallbackFollowers: "18M" },
  { username: "disney", displayName: "Disney", category: "Entertainment and media conglomerate", country: "United States", fallbackFollowers: "65M" },
  { username: "victoriassecret", displayName: "Victoria's Secret", category: "Lingerie and fashion brand", country: "United States", fallbackFollowers: "70M" },
  { username: "cocacola", displayName: "Coca-Cola", category: "Beverage multinational", country: "United States", fallbackFollowers: "110M" },
  { username: "ufc", displayName: "UFC", category: "Mixed martial arts promotion", country: "United States", fallbackFollowers: "55M" },
  { username: "playstation", displayName: "PlayStation", category: "Gaming brand", country: "Japan", fallbackFollowers: "40M" },
  { username: "zara", displayName: "ZARA", category: "Fashion retailer", country: "Spain", fallbackFollowers: "60M" },
  { username: "louisvuitton", displayName: "Louis Vuitton", category: "Luxury fashion house", country: "France", fallbackFollowers: "65M" },
  { username: "sportscenter", displayName: "SportsCenter", category: "Sports news show", country: "United States", fallbackFollowers: "35M" },
  { username: "nfl", displayName: "NFL", category: "American football league", country: "United States", fallbackFollowers: "40M" },
  { username: "chanelofficial", displayName: "Chanel", category: "Luxury fashion house", country: "France", fallbackFollowers: "60M" },
];

export { FEATURED_META };

/**
 * Real profile data (name, follower count, a permanently-hosted logo) for
 * the static featured-account list — populated once via a one-off admin
 * script (`scripts/populate-featured-profiles.mjs`), never by the app
 * itself. No TTL, no live HikerAPI fallback: an account the store doesn't
 * have data for yet just shows `meta` (name/category/fallback follower
 * count, initials in place of a logo) until the next deliberate
 * population run, rather than ever triggering a request on a page view.
 */
export async function getFeaturedProfiles(): Promise<FeaturedProfile[]> {
  const stored = await getStoredFeaturedProfiles();
  const byUsername = new Map(stored.map((p) => [p.username, p]));

  return FEATURED_META.map((meta) => {
    const s = byUsername.get(meta.username);
    if (!s) return { meta, profile: null };

    const profile: Profile = {
      username: s.username,
      profileImage: s.logoUrl,
      profileImageHd: s.logoUrl,
      fullName: s.fullName,
      bio: null,
      followers: s.followers,
      following: null,
      posts: null,
      isVerified: s.isVerified,
      isPublic: true,
      stories: [],
      category: s.category,
      externalUrl: null,
    };
    return { meta, profile };
  });
}
