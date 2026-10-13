import { get as getConfigValue } from "@vercel/global-config";
import { writeGlobalConfigItem } from "@/lib/global-config-write";

/**
 * Admin-dashboard-managed API keys, stored in Vercel Global Config
 * (store id `ecfg_j1zztto7tbn1hvnlbsmas3qqrzhc`, slug `hikerapi-keys`,
 * project env var `GLOBAL_CONFIG`). Global Config was chosen over a full
 * database because this is exactly its intended shape: a small, read-very-
 * often / written-rarely piece of app config (comparable to a feature
 * flag), read fresh on every provider call with no redeploy needed when
 * the admin dashboard adds or replaces a key.
 *
 * Holds keys for every supported provider, each under its own item. The
 * original HikerAPI item (`hikerApiKeys`) is untouched, and every function
 * defaults to HikerAPI so pre-existing callers behave exactly as before.
 */
export type ApiProviderId = "hikerapi" | "scrapecreators";

export interface StoredApiKey {
  id: string;
  label: string;
  key: string;
  addedAt: string;
}

/** Same shape as `StoredApiKey`; kept so existing imports keep compiling. */
export type StoredHikerApiKey = StoredApiKey;

const STORE_KEYS: Record<ApiProviderId, string> = {
  hikerapi: "hikerApiKeys",
  scrapecreators: "scrapeCreatorsKeys",
};

function isStoredKey(value: unknown): value is StoredApiKey {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as StoredApiKey).id === "string" &&
    typeof (value as StoredApiKey).key === "string" &&
    (value as StoredApiKey).key.length > 0
  );
}

/**
 * Keys added through the admin dashboard. Never throws — a Global Config
 * outage degrades to "no dashboard-managed keys" (callers fall back to the
 * legacy env-var keys below), not a broken site.
 */
export async function getStoredKeys(provider: ApiProviderId = "hikerapi"): Promise<StoredApiKey[]> {
  try {
    const value = await getConfigValue<unknown>(STORE_KEYS[provider]);
    if (!Array.isArray(value)) return [];
    return value.filter(isStoredKey);
  } catch (err) {
    console.error("[key-store] Global Config read failed:", err);
    return [];
  }
}

/**
 * The original key source. HikerAPI: `HIKERAPI_KEY` plus however many
 * `HIKERAPI_Fallback_N_KEY` env vars are set. Scrape Creators:
 * `SCRAPECREATORS_API_KEY` plus `SCRAPECREATORS_Fallback_N_KEY`. Kept as a
 * safety net — keys configured this way keep working even if nothing has
 * been added through the dashboard yet, or Global Config is unreachable.
 */
export function getEnvKeys(provider: ApiProviderId = "hikerapi"): string[] {
  const [primaryVar, fallbackPrefix] =
    provider === "hikerapi"
      ? ["HIKERAPI_KEY", "HIKERAPI_Fallback_"]
      : ["SCRAPECREATORS_API_KEY", "SCRAPECREATORS_Fallback_"];
  const keys: string[] = [];
  if (process.env[primaryVar]) keys.push(process.env[primaryVar] as string);
  for (let i = 1; ; i++) {
    const key = process.env[`${fallbackPrefix}${i}_KEY`];
    if (!key) break;
    keys.push(key);
  }
  return keys;
}

/**
 * Every usable key for a provider, in the order its client should try
 * them: dashboard-managed keys first (what the owner actively curates and
 * can reorder by replacing/removing), then legacy env-var keys as a safety
 * net — deduplicated so a key present in both places is only tried once.
 */
export async function getAllApiKeys(provider: ApiProviderId): Promise<string[]> {
  const stored = (await getStoredKeys(provider)).map((k) => k.key);
  const env = getEnvKeys(provider);
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const key of [...stored, ...env]) {
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(key);
  }
  return merged;
}

export function getAllHikerApiKeys(): Promise<string[]> {
  return getAllApiKeys("hikerapi");
}

/**
 * Overwrites a provider's dashboard-managed key list. Writes go through the
 * Vercel REST API (Global Config's own SDK/read-token is read-only), so this
 * needs `VERCEL_API_TOKEN` — a dedicated token stored only for this write
 * path, never sent to the client.
 */
export async function writeStoredKeys(
  keys: StoredApiKey[],
  provider: ApiProviderId = "hikerapi",
): Promise<void> {
  await writeGlobalConfigItem(STORE_KEYS[provider], keys);
}
