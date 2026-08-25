import "server-only";
import { Redis } from "@upstash/redis";
import type { PageSeoSettings } from "@/types/page-settings";

const KEY_PREFIX = "page-settings:";
const INDEX_KEY = "page-settings:__index";

let client: Redis | null | undefined;

/** Lazily constructed so a build/render without Redis env vars yet configured never crashes. */
function getClient(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

export class SettingsStoreNotConfiguredError extends Error {
  constructor() {
    super("Redis is not configured (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN missing).");
    this.name = "SettingsStoreNotConfiguredError";
  }
}

export function isSettingsStoreConfigured(): boolean {
  return getClient() !== null;
}

export async function getPageSettings(path: string): Promise<PageSeoSettings | null> {
  const redis = getClient();
  if (!redis) throw new SettingsStoreNotConfiguredError();
  return await redis.get<PageSeoSettings>(`${KEY_PREFIX}${path}`);
}

/** Never throws — used by public-facing render paths, where a store outage should silently fall back to built-in defaults rather than break the page. */
export async function getPageSettingsSafe(path: string): Promise<PageSeoSettings | null> {
  try {
    return await getPageSettings(path);
  } catch (err) {
    if (!(err instanceof SettingsStoreNotConfiguredError)) {
      console.error(`[admin-settings] failed to read overrides for ${path}:`, err);
    }
    return null;
  }
}

export async function setPageSettings(path: string, settings: PageSeoSettings): Promise<void> {
  const redis = getClient();
  if (!redis) throw new SettingsStoreNotConfiguredError();
  await redis.set(`${KEY_PREFIX}${path}`, settings);
  await redis.sadd(INDEX_KEY, path);
}

export async function listOverriddenPaths(): Promise<string[]> {
  const redis = getClient();
  if (!redis) throw new SettingsStoreNotConfiguredError();
  const members = await redis.smembers<string[]>(INDEX_KEY);
  return members ?? [];
}
