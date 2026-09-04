import { getProvider } from "./index";
import { getCached, setCached } from "./cache";
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
  { username: "instagram", displayName: "Instagram", category: "Platform updates and features", country: null, fallbackFollowers: "686M" },
  { username: "cristiano", displayName: "Cristiano Ronaldo", category: "Portuguese footballer", country: "Portugal", fallbackFollowers: "679M" },
  { username: "leomessi", displayName: "Lionel Messi", category: "Argentine footballer", country: "Argentina", fallbackFollowers: "516M" },
  { username: "selenagomez", displayName: "Selena Gomez", category: "American singer and actress", country: "United States", fallbackFollowers: "403M" },
  { username: "therock", displayName: "Dwayne \"The Rock\" Johnson", category: "American actor and former wrestler", country: "United States", fallbackFollowers: "381M" },
  { username: "kyliejenner", displayName: "Kylie Jenner", category: "American media personality and businesswoman", country: "United States", fallbackFollowers: "381M" },
  { username: "arianagrande", displayName: "Ariana Grande", category: "American singer and actress", country: "United States", fallbackFollowers: "363M" },
  { username: "kimkardashian", displayName: "Kim Kardashian", category: "American media personality and businesswoman", country: "United States", fallbackFollowers: "345M" },
  { username: "beyonce", displayName: "Beyoncé", category: "American singer and songwriter", country: "United States", fallbackFollowers: "300M" },
  { username: "khloekardashian", displayName: "Khloé Kardashian", category: "American media personality and model", country: "United States", fallbackFollowers: "293M" },
  { username: "nike", displayName: "Nike", category: "Sportswear multinational", country: "United States", fallbackFollowers: "291M" },
  { username: "lilbieber", displayName: "Justin Bieber", category: "Musician", country: "Canada", fallbackFollowers: "286M" },
  { username: "kendalljenner", displayName: "Kendall Jenner", category: "Media personality", country: "United States", fallbackFollowers: "278M" },
  { username: "taylorswift", displayName: "Taylor Swift", category: "Musician", country: "United States", fallbackFollowers: "273M" },
  { username: "natgeo", displayName: "National Geographic", category: "Magazine", country: "United States", fallbackFollowers: "269M" },
  { username: "neymarjr", displayName: "Neymar", category: "Footballer", country: "Brazil", fallbackFollowers: "241M" },
  { username: "jlo", displayName: "Jennifer Lopez", category: "Musician and actress", country: "United States", fallbackFollowers: "240M" },
  { username: "kourtneykardash", displayName: "Kourtney Kardashian", category: "Media personality", country: "United States", fallbackFollowers: "209M" },
  { username: "miley", displayName: "Miley Cyrus", category: "Musician and actress", country: "United States", fallbackFollowers: "205M" },
  { username: "katyperry", displayName: "Katy Perry", category: "Musician", country: "United States", fallbackFollowers: "195M" },
];

const CACHE_KEY = "featured-profiles:all";
// Long TTL is the point — this is a decorative carousel of well-known
// accounts, not a live lookup, so it shouldn't hit the provider on every
// page view. Refreshing periodically (rather than fetching once forever)
// just keeps avatar URLs from going permanently stale, since Instagram's
// CDN links expire.
const CACHE_TTL_MS = 12 * 60 * 60_000;

/**
 * Fetches (and caches) basic profile data for the static featured-account
 * list. Never throws — a provider failure for one or all accounts falls
 * back to the static `meta` info, since this is decorative, not a lookup
 * result the user is waiting on.
 */
export async function getFeaturedProfiles(): Promise<FeaturedProfile[]> {
  const cached = getCached<FeaturedProfile[]>(CACHE_KEY);
  if (cached) return cached;

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

  setCached(CACHE_KEY, profiles, CACHE_TTL_MS);
  return profiles;
}
