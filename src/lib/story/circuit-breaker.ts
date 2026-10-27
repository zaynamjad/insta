import "server-only";
import { getRedisClient } from "@/lib/redis";
import { getHybridConfig } from "./hybrid-config";

/**
 * Per-provider circuit breaker. After `failureThreshold` provider-side
 * failures inside `failureWindowS` the circuit opens for `openForS` seconds,
 * during which the router skips that provider instead of sending it more
 * traffic — which is what stops a failing/blocked provider from turning every
 * visitor request into another slow, wasted (and for paid providers,
 * possibly billed) call. When the open period ends, requests flow again and
 * a fresh run of failures is needed to re-open it.
 *
 * State lives in Redis so every serverless instance sees the same breaker;
 * without Redis it falls back to per-instance memory (still protective, just
 * not coordinated). Only failures a provider itself caused should be
 * recorded here — never invalid input or "not found".
 */

const OPEN_PREFIX = "breaker:open:";
const FAIL_PREFIX = "breaker:fail:";

const memoryFailures = new Map<string, { count: number; windowEndsAt: number }>();
const memoryOpenUntil = new Map<string, number>();

export async function isCircuitOpen(provider: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return (memoryOpenUntil.get(provider) ?? 0) > Date.now();
  try {
    return (await redis.exists(OPEN_PREFIX + provider)) === 1;
  } catch {
    return false; // never let a Redis hiccup block a provider
  }
}

/** Returns true when this failure tripped the circuit open. */
export async function recordProviderFailure(provider: string): Promise<boolean> {
  const { failureThreshold, failureWindowS, openForS } = getHybridConfig().breaker;
  const redis = getRedisClient();

  if (!redis) {
    const now = Date.now();
    const cur = memoryFailures.get(provider);
    const entry = cur && now < cur.windowEndsAt ? cur : { count: 0, windowEndsAt: now + failureWindowS * 1000 };
    entry.count += 1;
    memoryFailures.set(provider, entry);
    if (entry.count < failureThreshold) return false;
    memoryFailures.delete(provider);
    memoryOpenUntil.set(provider, now + openForS * 1000);
    return true;
  }

  try {
    const failKey = FAIL_PREFIX + provider;
    const count = await redis.incr(failKey);
    if (count === 1) await redis.expire(failKey, failureWindowS);
    if (count < failureThreshold) return false;
    await redis.set(OPEN_PREFIX + provider, "1", { ex: openForS });
    await redis.del(failKey);
    return true;
  } catch {
    return false;
  }
}

/** A success clears the run of failures, so isolated errors never accumulate into a trip. */
export async function recordProviderSuccess(provider: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    memoryFailures.delete(provider);
    return;
  }
  try {
    await redis.del(FAIL_PREFIX + provider);
  } catch {
    // best effort
  }
}

export function resetBreakersForTests() {
  memoryFailures.clear();
  memoryOpenUntil.clear();
}
