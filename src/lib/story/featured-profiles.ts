import { getProvider } from "./index";
import { getCached, setCached } from "./cache";
import { getRedisClient } from "@/lib/redis";
import type { Profile } from "@/types/profile";

export interface FeaturedProfileMeta {
  username: string;
  displayName: string;
  category: string;
  country: string | null;
  /** Shown until (or unless) a live fetch succeeds. */
  fallbackFollowers: string;
}

export interface FeaturedProfile {
  meta: FeaturedProfileMeta;
  /** null when the live fetch failed/is unavailable — callers fall back to `meta`. */
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
  { username: "chanel", displayName: "Chanel", category: "Luxury fashion house", country: "France", fallbackFollowers: "60M" },
];

// Bump the suffix whenever FEATURED_META's account list changes — the TTL
// below is long (days) specifically so this doesn't hit the provider on
// every page view, which means a stale cache would otherwise keep serving
// the old account list in production for up to that whole window.
const CACHE_KEY = "featured-profiles:all:v2";
// Long TTL is the point — this is a decorative carousel of well-known
// accounts, not a live lookup, so it shouldn't hit the provider on every
// page view. Refreshing periodically (rather than fetching once forever)
// just keeps avatar URLs from going permanently stale, since Instagram's
// CDN links expire. Configurable via env since the right tradeoff (avatar
// staleness vs. HikerAPI credit spend) depends on plan/traffic, not code.
const DEFAULT_CACHE_TTL_HOURS = 120;
const CACHE_TTL_HOURS = Number(process.env.FEATURED_PROFILES_CACHE_TTL_HOURS) || DEFAULT_CACHE_TTL_HOURS;
const CACHE_TTL_MS = CACHE_TTL_HOURS * 60 * 60_000;
const CACHE_TTL_SECONDS = CACHE_TTL_MS / 1000;

/**
 * Fetches (and caches) basic profile data for the static featured-account
 * list. Never throws — a provider failure for one or all accounts falls
 * back to the static `meta` info, since this is decorative, not a lookup
 * result the user is waiting on.
 *
 * Cached in Redis when configured, so the 12h TTL is real — it survives
 * redeploys and is shared across every serverless instance, not just the
 * one warm process that happened to serve the first request. Falls back
 * to the in-memory cache (per-instance only) when Redis isn't configured
 * or a Redis call fails, so this never blocks on the cache layer.
 */
export async function getFeaturedProfiles(): Promise<FeaturedProfile[]> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get<FeaturedProfile[]>(CACHE_KEY);
      if (cached) return cached;
    } catch (err) {
      console.error("[featured-profiles] Redis read failed:", err);
    }
  } else {
    const cached = getCached<FeaturedProfile[]>(CACHE_KEY);
    if (cached) return cached;
  }

  const provider = getProvider();
  const fetchOne = provider.getBasicProfile?.bind(provider) ?? provider.getProfile.bind(provider);

  const results = await Promise.allSettled(
    FEATURED_META.map((meta) => fetchOne(meta.username)),
  );

  const profiles: FeaturedProfile[] = FEATURED_META.map((meta, i) => {
    const result = results[i];
    return {
      meta,
      profile: result.status === "fulfilled" ? result.value : null,
    };
  });

  if (redis) {
    try {
      await redis.set(CACHE_KEY, profiles, { ex: CACHE_TTL_SECONDS });
    } catch (err) {
      console.error("[featured-profiles] Redis write failed:", err);
    }
  } else {
    setCached(CACHE_KEY, profiles, CACHE_TTL_MS);
  }

  return profiles;
}
