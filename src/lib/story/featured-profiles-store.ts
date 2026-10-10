import { get as getConfigValue } from "@vercel/global-config";
import { writeGlobalConfigItem } from "@/lib/global-config-write";

/**
 * Real data for the homepage's featured-accounts carousel, captured once
 * (via a one-off admin-run population, not anything the app itself
 * triggers) and stored permanently in the same Global Config store the
 * HikerAPI keys use. `getFeaturedProfiles()` reads this directly with no
 * TTL and no live-fetch fallback — this is a decorative carousel of
 * well-known accounts, not something worth spending HikerAPI credits on
 * every day or week just to keep warm.
 *
 * `logoUrl` is a Vercel Blob URL, not the original Instagram CDN one —
 * Instagram's signed CDN URLs expire; re-hosting the image once at
 * population time is what makes this genuinely permanent instead of just
 * long-TTL-cached.
 */
export interface StoredFeaturedProfile {
  username: string;
  fullName: string | null;
  category: string | null;
  followers: number | null;
  isVerified: boolean;
  logoUrl: string | null;
  updatedAt: string;
}

const STORE_KEY = "featuredProfiles";

function isStoredProfile(value: unknown): value is StoredFeaturedProfile {
  return !!value && typeof value === "object" && typeof (value as StoredFeaturedProfile).username === "string";
}

export async function getStoredFeaturedProfiles(): Promise<StoredFeaturedProfile[]> {
  try {
    const value = await getConfigValue<unknown>(STORE_KEY);
    if (!Array.isArray(value)) return [];
    return value.filter(isStoredProfile);
  } catch (err) {
    console.error("[featured-profiles-store] Global Config read failed:", err);
    return [];
  }
}

export async function writeStoredFeaturedProfiles(profiles: StoredFeaturedProfile[]): Promise<void> {
  await writeGlobalConfigItem(STORE_KEY, profiles);
}
