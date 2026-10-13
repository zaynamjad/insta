import { get as getConfigValue } from "@vercel/global-config";
import { writeGlobalConfigItem } from "@/lib/global-config-write";
import type { ApiProviderId } from "./key-store";

/**
 * Which API provider is Primary, whether failover to the other one is on,
 * and per-provider enable switches. Persisted in the same Global Config
 * store as the API keys (item `apiProviderSettings`) and re-read on every
 * request, so a dashboard change applies to the next request with no
 * deploy or restart. The Fallback is never stored — it's always "the other
 * provider", so both providers can never hold the same role.
 */
export interface ApiProviderSettings {
  primary: ApiProviderId;
  fallbackEnabled: boolean;
  enabled: Record<ApiProviderId, boolean>;
}

export const PROVIDER_IDS: readonly ApiProviderId[] = ["hikerapi", "scrapecreators"];

export const PROVIDER_LABELS: Record<ApiProviderId, string> = {
  hikerapi: "HikerAPI",
  scrapecreators: "Scrape Creators",
};

/**
 * Scrape Creators serves everything it can (profile, posts, post, highlights)
 * and HikerAPI is its fallback; Stories always use HikerAPI since Scrape
 * Creators has no Stories endpoint. A Primary with no key is skipped by
 * `planProviders`, so with only HikerAPI configured behavior is unchanged.
 */
export const DEFAULT_PROVIDER_SETTINGS: ApiProviderSettings = {
  primary: "scrapecreators",
  fallbackEnabled: true,
  enabled: { hikerapi: true, scrapecreators: true },
};

const STORE_KEY = "apiProviderSettings";

export function otherProvider(id: ApiProviderId): ApiProviderId {
  return id === "hikerapi" ? "scrapecreators" : "hikerapi";
}

export function isProviderId(value: unknown): value is ApiProviderId {
  return value === "hikerapi" || value === "scrapecreators";
}

/** Coerces whatever is stored into a complete, valid settings object. */
export function parseProviderSettings(value: unknown): ApiProviderSettings {
  const d = DEFAULT_PROVIDER_SETTINGS;
  if (!value || typeof value !== "object") return { ...d, enabled: { ...d.enabled } };
  const v = value as Partial<ApiProviderSettings> & { enabled?: Partial<Record<ApiProviderId, unknown>> };
  return {
    primary: isProviderId(v.primary) ? v.primary : d.primary,
    fallbackEnabled: typeof v.fallbackEnabled === "boolean" ? v.fallbackEnabled : d.fallbackEnabled,
    enabled: {
      hikerapi: typeof v.enabled?.hikerapi === "boolean" ? v.enabled.hikerapi : d.enabled.hikerapi,
      scrapecreators:
        typeof v.enabled?.scrapecreators === "boolean" ? v.enabled.scrapecreators : d.enabled.scrapecreators,
    },
  };
}

/** Never throws — a Global Config outage degrades to the HikerAPI-first default. */
export async function getProviderSettings(): Promise<ApiProviderSettings> {
  try {
    return parseProviderSettings(await getConfigValue<unknown>(STORE_KEY));
  } catch (err) {
    console.error("[provider-settings] Global Config read failed:", err);
    return parseProviderSettings(null);
  }
}

export async function writeProviderSettings(settings: ApiProviderSettings): Promise<void> {
  await writeGlobalConfigItem(STORE_KEY, settings);
}

/**
 * Returns a human-readable problem with `settings`, or null if they're
 * acceptable. A disabled or unconfigured provider can't be Primary.
 */
export function validateProviderSettings(
  settings: ApiProviderSettings,
  configured: Record<ApiProviderId, boolean>,
): string | null {
  const { primary } = settings;
  if (!settings.enabled[primary]) {
    return `${PROVIDER_LABELS[primary]} is disabled and can't be the Primary provider.`;
  }
  if (!configured[primary]) {
    return `${PROVIDER_LABELS[primary]} has no API key configured and can't be the Primary provider.`;
  }
  return null;
}

/**
 * The ordered list of providers to try for one operation: Primary first,
 * then the Fallback if failover is on. A provider is only eligible when it
 * is enabled, has credentials, and actually supports the operation —
 * providers lacking the operation are skipped rather than faked. If the
 * Primary can't serve the operation (e.g. Scrape Creators has no Stories
 * endpoint) the other usable provider serves it even with failover off,
 * since the alternative is that feature silently breaking.
 */
export function planProviders(
  settings: ApiProviderSettings,
  configured: Record<ApiProviderId, boolean>,
  supports: (id: ApiProviderId) => boolean,
): ApiProviderId[] {
  const usable = (id: ApiProviderId) => settings.enabled[id] && configured[id] && supports(id);
  const primary = settings.primary;
  const secondary = otherProvider(primary);
  const plan: ApiProviderId[] = [];
  if (usable(primary)) plan.push(primary);
  if (usable(secondary) && (settings.fallbackEnabled || !usable(primary))) plan.push(secondary);
  return plan;
}
