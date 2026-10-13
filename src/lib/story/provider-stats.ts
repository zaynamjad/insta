import "server-only";
import { getRedisClient } from "@/lib/redis";
import type { ApiProviderId } from "./key-store";

/**
 * Per-provider usage counters and a short request/fallback history, kept in
 * the app's existing Redis (see `src/lib/redis.ts`) so the admin dashboard
 * can show them across serverless instances. Entirely best-effort: with no
 * Redis configured, or if Redis errors, recording is silently skipped and
 * lookups are never affected. Only operation names and error classes are
 * stored — never usernames, URLs, API keys or raw payloads.
 */
const STATS_PREFIX = "api-providers:stats:";
const LOG_KEY = "api-providers:log";
const LOG_MAX = 100;
const ERROR_MAX_LEN = 160;

export interface ProviderAttemptRecord {
  provider: ApiProviderId;
  operation: string;
  ok: boolean;
  /** True when this attempt was on the Fallback after the Primary failed. */
  isFallback: boolean;
  durationMs: number;
  /** Short error class/message when `ok` is false. */
  error?: string;
}

export interface ProviderStats {
  requests: number;
  successes: number;
  failures: number;
  fallbackAttempts: number;
  fallbackRecoveries: number;
  creditsCharged: number | null;
  creditsRemaining: number | null;
  lastRequestAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
}

export interface ProviderLogEntry extends ProviderAttemptRecord {
  at: string;
}

const EMPTY: ProviderStats = {
  requests: 0,
  successes: 0,
  failures: 0,
  fallbackAttempts: 0,
  fallbackRecoveries: 0,
  creditsCharged: null,
  creditsRemaining: null,
  lastRequestAt: null,
  lastSuccessAt: null,
  lastErrorAt: null,
  lastError: null,
};

export async function recordAttempt(rec: ProviderAttemptRecord): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    const now = new Date().toISOString();
    const key = STATS_PREFIX + rec.provider;
    const p = redis.pipeline();
    p.hincrby(key, "requests", 1);
    p.hincrby(key, rec.ok ? "successes" : "failures", 1);
    p.hset(key, { lastRequestAt: now });
    if (rec.ok) p.hset(key, { lastSuccessAt: now });
    else p.hset(key, { lastErrorAt: now, lastError: (rec.error ?? "error").slice(0, ERROR_MAX_LEN) });
    if (rec.isFallback) {
      p.hincrby(key, "fallbackAttempts", 1);
      if (rec.ok) p.hincrby(key, "fallbackRecoveries", 1);
    }
    const entry: ProviderLogEntry = { ...rec, error: rec.error?.slice(0, ERROR_MAX_LEN), at: now };
    p.lpush(LOG_KEY, JSON.stringify(entry));
    p.ltrim(LOG_KEY, 0, LOG_MAX - 1);
    await p.exec();
  } catch (err) {
    console.error("[provider-stats] record failed:", err instanceof Error ? err.message : err);
  }
}

/** Scrape Creators reports `credits_charged` / `credits_remaining` on every response. */
export async function recordCredits(
  provider: ApiProviderId,
  credits: { charged?: number | null; remaining?: number | null },
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    const key = STATS_PREFIX + provider;
    const p = redis.pipeline();
    if (typeof credits.charged === "number") p.hincrbyfloat(key, "creditsCharged", credits.charged);
    if (typeof credits.remaining === "number") p.hset(key, { creditsRemaining: credits.remaining });
    await p.exec();
  } catch (err) {
    console.error("[provider-stats] credits record failed:", err instanceof Error ? err.message : err);
  }
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

/** `null` means "Redis isn't configured or is unreachable" — distinct from all-zero stats. */
export async function getProviderStats(provider: ApiProviderId): Promise<ProviderStats | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    const h = await redis.hgetall<Record<string, unknown>>(STATS_PREFIX + provider);
    if (!h) return { ...EMPTY };
    return {
      requests: num(h.requests),
      successes: num(h.successes),
      failures: num(h.failures),
      fallbackAttempts: num(h.fallbackAttempts),
      fallbackRecoveries: num(h.fallbackRecoveries),
      creditsCharged: numOrNull(h.creditsCharged),
      creditsRemaining: numOrNull(h.creditsRemaining),
      lastRequestAt: str(h.lastRequestAt),
      lastSuccessAt: str(h.lastSuccessAt),
      lastErrorAt: str(h.lastErrorAt),
      lastError: str(h.lastError),
    };
  } catch (err) {
    console.error("[provider-stats] read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getRecentLog(limit = 25): Promise<ProviderLogEntry[]> {
  const redis = getRedisClient();
  if (!redis) return [];
  try {
    const rows = await redis.lrange<ProviderLogEntry | string>(LOG_KEY, 0, limit - 1);
    return rows
      .map((r) => {
        if (typeof r !== "string") return r;
        try {
          return JSON.parse(r) as ProviderLogEntry;
        } catch {
          return null;
        }
      })
      .filter((r): r is ProviderLogEntry => !!r && typeof r === "object");
  } catch (err) {
    console.error("[provider-stats] log read failed:", err instanceof Error ? err.message : err);
    return [];
  }
}
