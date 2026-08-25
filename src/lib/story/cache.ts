/**
 * In-memory TTL cache for profile lookups, keyed by normalized username.
 * A longer TTL than a typical API cache is intentional here: profile
 * metadata (bio, follower counts, avatar) doesn't change second-to-second,
 * and every cache hit is one fewer request against Instagram's servers —
 * which matters both for our own reliability (less exposure to blocking)
 * and for being a reasonable neighbor to a site whose robots.txt asks
 * automated clients not to do this at all (see docs/story-retrieval-limitations.md).
 *
 * Per-instance only — see the README's scaling notes for the shared-store
 * upgrade path once this needs to hold across multiple warm instances.
 */

const DEFAULT_TTL_MS = 10 * 60_000;

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}
