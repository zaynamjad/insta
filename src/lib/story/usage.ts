import "server-only";
import { getRedisClient } from "@/lib/redis";
import { getHybridConfig } from "./hybrid-config";

/**
 * Credit accounting and cache metrics, kept in the app's Redis so they are
 * shared across serverless instances and survive deploys. Entirely
 * best-effort — with no Redis, or on a Redis error, recording is skipped and
 * lookups are unaffected. Only endpoint names (never query strings, so never
 * usernames), counts and unit totals are stored: no keys, headers or payloads.
 *
 * Billable units follow HikerAPI's own OpenAPI notes: most endpoints are one
 * request, but several are documented as costing more ("Billing: 2 requests
 * per call"). Those are listed explicitly below; an endpoint not listed is
 * counted as 1 and marked in the dashboard as an assumption rather than a
 * verified price. HikerAPI bills any successful response (including 4xx such
 * as 404) and does not bill 5xx, which `isBilled` encodes.
 */

const USAGE_PREFIX = "api-usage:";

/** Units per call by path prefix, from HikerAPI's OpenAPI descriptions. */
const HIKER_UNITS: { prefix: string; units: number }[] = [
  { prefix: "/v2/user/stories/by/username", units: 3 },
  { prefix: "/v2/user/highlights/by/username", units: 3 },
  { prefix: "/v1/user/highlights/by/username", units: 3 },
  { prefix: "/v2/user/stories", units: 2 },
  { prefix: "/v1/user/stories", units: 2 },
  { prefix: "/v2/user/highlights", units: 2 },
  { prefix: "/v1/user/highlights", units: 2 },
];

/** Endpoints whose price isn't stated in HikerAPI's docs; counted as 1 and flagged as assumed. */
const ASSUMED_ONE_UNIT = ["/v1/highlight/by/url", "/v1/media/by/code", "/v1/user/medias/chunk"];

/** Strips the query string so usernames never reach the metrics store. */
export function endpointOf(pathWithQuery: string): string {
  return pathWithQuery.split("?")[0];
}

export function hikerUnitsFor(pathWithQuery: string): number {
  const endpoint = endpointOf(pathWithQuery);
  return HIKER_UNITS.find((e) => endpoint.startsWith(e.prefix))?.units ?? 1;
}

export function isAssumedPrice(pathWithQuery: string): boolean {
  return ASSUMED_ONE_UNIT.includes(endpointOf(pathWithQuery));
}

/** HikerAPI does not charge 5xx responses (or requests that never got a response). */
export function isBilled(status: number | null): boolean {
  return status !== null && status < 500 && status !== 429;
}

function monthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7); // YYYY-MM, UTC
}

export async function recordCacheEvent(feature: string, hit: boolean): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.hincrby(`${USAGE_PREFIX}cache:${monthKey()}`, `${feature}:${hit ? "hit" : "miss"}`, 1);
  } catch (err) {
    console.error("[usage] cache event failed:", err instanceof Error ? err.message : err);
  }
}

export interface HikerCallRecord {
  /** Path as requested (query string is stripped before storing). */
  path: string;
  /** HTTP status, or null when no response arrived (timeout / network failure). */
  status: number | null;
}

/** Records one HikerAPI HTTP call and raises a console alert when a monthly threshold is crossed. */
export async function recordHikerCall(call: HikerCallRecord): Promise<number> {
  const billed = isBilled(call.status);
  const units = billed ? hikerUnitsFor(call.path) : 0;
  const redis = getRedisClient();
  if (!redis) return units;

  try {
    const endpoint = endpointOf(call.path);
    const key = `${USAGE_PREFIX}hikerapi:${monthKey()}`;
    const p = redis.pipeline();
    p.hincrby(key, "calls:total", 1);
    p.hincrby(key, `calls:${endpoint}`, 1);
    if (units > 0) {
      p.hincrby(key, "units:total", units);
      p.hincrby(key, `units:${endpoint}`, units);
    }
    const results = await p.exec<number[]>();

    const limit = getHybridConfig().hiker.monthlyUnitLimit;
    const total = typeof results[2] === "number" && units > 0 ? results[2] : null;
    if (limit > 0 && total !== null) await alertOnThreshold(key, total, limit);
  } catch (err) {
    console.error("[usage] hikerapi call record failed:", err instanceof Error ? err.message : err);
  }
  return units;
}

/** Alert-ready: logs once per threshold per month, and stores the flag so the dashboard can show it. */
async function alertOnThreshold(key: string, total: number, limit: number) {
  const redis = getRedisClient();
  if (!redis) return;
  for (const pct of [80, 100]) {
    if (total >= (limit * pct) / 100) {
      const first = await redis.hsetnx(key, `alert:${pct}`, new Date().toISOString());
      if (first) {
        console.warn(`[usage] HikerAPI monthly units at ${total}/${limit} (${pct}% threshold crossed).`);
      }
    }
  }
}

export interface MonthlyUsage {
  month: string;
  hiker: {
    callsTotal: number;
    unitsTotal: number;
    perEndpoint: { endpoint: string; calls: number; units: number; assumed: boolean }[];
    alerts: { pct: number; at: string }[];
  };
  cache: { feature: string; hits: number; misses: number }[];
}

/** `null` means Redis isn't configured or is unreachable — distinct from a month with no traffic. */
export async function getMonthlyUsage(month = monthKey()): Promise<MonthlyUsage | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    const [h, c] = await Promise.all([
      redis.hgetall<Record<string, unknown>>(`${USAGE_PREFIX}hikerapi:${month}`),
      redis.hgetall<Record<string, unknown>>(`${USAGE_PREFIX}cache:${month}`),
    ]);
    const hash = h ?? {};
    const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

    const endpoints = Object.keys(hash)
      .filter((k) => k.startsWith("calls:") && k !== "calls:total")
      .map((k) => k.slice("calls:".length));
    const features = new Set(Object.keys(c ?? {}).map((k) => k.split(":")[0]));

    return {
      month,
      hiker: {
        callsTotal: n(hash["calls:total"]),
        unitsTotal: n(hash["units:total"]),
        perEndpoint: endpoints.map((endpoint) => ({
          endpoint,
          calls: n(hash[`calls:${endpoint}`]),
          units: n(hash[`units:${endpoint}`]),
          assumed: isAssumedPrice(endpoint),
        })),
        alerts: [80, 100]
          .filter((pct) => typeof hash[`alert:${pct}`] === "string")
          .map((pct) => ({ pct, at: hash[`alert:${pct}`] as string })),
      },
      cache: [...features].map((feature) => ({
        feature,
        hits: n(c?.[`${feature}:hit`]),
        misses: n(c?.[`${feature}:miss`]),
      })),
    };
  } catch (err) {
    console.error("[usage] read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
