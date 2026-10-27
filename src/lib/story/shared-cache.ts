import "server-only";
import crypto from "node:crypto";
import { getRedisClient } from "@/lib/redis";
import { recordCacheEvent } from "./usage";

/**
 * Cache-aside loading backed by the app's shared Redis (Upstash), so a result
 * fetched by one serverless instance is reused by every other one — the old
 * in-memory `cache.ts` only helped within a single warm instance.
 *
 * `cachedLoad` is the single entry point:
 *   1. cache hit            → return it, no provider call
 *   2. miss                 → take a short Redis lock so N simultaneous
 *                             identical requests produce ONE upstream call,
 *                             re-check the cache once the lock is held, load,
 *                             then store
 *   3. lock held elsewhere  → wait for that request's result instead of
 *                             calling upstream again
 *
 * What is never cached: a loader that throws, and any value whose
 * `ttlSeconds` is 0 (the callers use that for errors and unverified/empty
 * results). A Redis outage degrades to "load without caching", never to a
 * failed request.
 *
 * Without Redis credentials this falls back to a per-process Map and logs a
 * warning once in production. That fallback is NOT shared across Vercel
 * invocations and is not presented as if it were: `isSharedCacheAvailable()`
 * reports the truth and the admin dashboard shows it.
 */

const LOCK_TTL_S = 20;
const LOCK_WAIT_MS = 10_000;
const LOCK_POLL_MS = 200;
const KEY_PREFIX = "story-cache:";

interface Envelope<T> {
  v: T;
}

const memory = new Map<string, { value: unknown; expiresAt: number }>();
// Same-instance dedupe: identical concurrent calls share one promise even before any Redis round trip.
const inflight = new Map<string, Promise<unknown>>();
let warnedNoRedis = false;

export function isSharedCacheAvailable(): boolean {
  return getRedisClient() !== null;
}

function warnNoRedis() {
  if (warnedNoRedis || process.env.NODE_ENV !== "production") return;
  warnedNoRedis = true;
  console.warn(
    "[shared-cache] Redis is not configured (UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN): " +
      "results are cached per instance only, so provider calls will not be shared across invocations.",
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface CachedLoadOptions<T> {
  /** Feature label for hit/miss metrics, e.g. "profile", "posts". */
  feature: string;
  /** Already-normalized cache key suffix, e.g. `profile:v1:alice`. */
  key: string;
  load: () => Promise<T>;
  /** Seconds to keep the loaded value; 0 means "do not cache". */
  ttlSeconds: (value: T) => number;
}

export function cachedLoad<T>(opts: CachedLoadOptions<T>): Promise<T> {
  const existing = inflight.get(opts.key);
  if (existing) return existing as Promise<T>;

  const promise = run(opts).finally(() => inflight.delete(opts.key));
  inflight.set(opts.key, promise);
  return promise;
}

async function run<T>(opts: CachedLoadOptions<T>): Promise<T> {
  const redis = getRedisClient();
  if (!redis) {
    warnNoRedis();
    return runInMemory(opts);
  }

  const key = KEY_PREFIX + opts.key;

  const hit = await readEnvelope<T>(key);
  if (hit) {
    await recordCacheEvent(opts.feature, true);
    return hit.v;
  }
  await recordCacheEvent(opts.feature, false);

  const lockKey = `lock:${key}`;
  const token = crypto.randomUUID();
  let locked = false;
  try {
    locked = (await redis.set(lockKey, token, { nx: true, ex: LOCK_TTL_S })) === "OK";
  } catch (err) {
    // Redis itself is failing — nobody else is "holding" anything we could wait for, so just load.
    console.error("[shared-cache] lock failed:", err instanceof Error ? err.message : err);
    return loadAndStore(opts, key);
  }

  if (!locked) {
    // Another request is already loading this exact key: wait for its result rather than spending a second call.
    const deadline = Date.now() + LOCK_WAIT_MS;
    while (Date.now() < deadline) {
      await sleep(LOCK_POLL_MS);
      const filled = await readEnvelope<T>(key);
      if (filled) return filled.v;
    }
    // The other request failed or timed out without storing anything; do the work ourselves.
    return loadAndStore(opts, key);
  }

  try {
    // Recheck: the previous lock holder may have stored the value between our miss and our lock.
    const filled = await readEnvelope<T>(key);
    if (filled) return filled.v;
    return await loadAndStore(opts, key);
  } finally {
    await releaseLock(lockKey, token);
  }
}

async function loadAndStore<T>(opts: CachedLoadOptions<T>, key: string): Promise<T> {
  const value = await opts.load();
  const ttl = opts.ttlSeconds(value);
  if (ttl > 0) {
    try {
      await getRedisClient()?.set(key, { v: value } satisfies Envelope<T>, { ex: ttl });
    } catch (err) {
      console.error("[shared-cache] write failed:", err instanceof Error ? err.message : err);
    }
  }
  return value;
}

async function readEnvelope<T>(key: string): Promise<Envelope<T> | null> {
  try {
    const raw = await getRedisClient()?.get<Envelope<T> | null>(key);
    return raw && typeof raw === "object" && "v" in raw ? raw : null;
  } catch (err) {
    console.error("[shared-cache] read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Only deletes the lock if it is still ours, so an expired lock re-taken by another request isn't released early. */
async function releaseLock(lockKey: string, token: string) {
  try {
    const redis = getRedisClient();
    if (redis && (await redis.get<string>(lockKey)) === token) await redis.del(lockKey);
  } catch {
    // The lock has a short TTL; failing to release it only delays the next loader by seconds.
  }
}

async function runInMemory<T>(opts: CachedLoadOptions<T>): Promise<T> {
  const entry = memory.get(opts.key);
  if (entry && Date.now() < entry.expiresAt) {
    await recordCacheEvent(opts.feature, true);
    return entry.value as T;
  }
  memory.delete(opts.key);
  await recordCacheEvent(opts.feature, false);

  const value = await opts.load();
  const ttl = opts.ttlSeconds(value);
  if (ttl > 0) memory.set(opts.key, { value, expiresAt: Date.now() + ttl * 1000 });
  return value;
}

/** Test helper: clears the in-process state this module keeps. */
export function resetSharedCacheForTests() {
  memory.clear();
  inflight.clear();
  warnedNoRedis = false;
}
