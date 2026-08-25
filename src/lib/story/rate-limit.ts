/**
 * Two independent in-memory fixed-window limiters:
 *
 *  - `checkClientRateLimit` — per visitor IP, protects our own API from abuse.
 *  - `checkOutboundRateLimit` — one shared bucket for ALL outbound requests
 *    this server makes to Instagram, regardless of who triggered them. This
 *    exists to be a reasonable neighbor to Instagram's infrastructure (and
 *    to reduce the odds of getting the deployment's IP blocked) — it caps
 *    total scrape volume independent of how many distinct users are
 *    searching.
 *
 * Both are per-instance only (see the project README's scaling notes) —
 * swap for a shared store (e.g. Upstash Redis via the Vercel Marketplace)
 * once traffic outgrows a single warm instance.
 */

const CLIENT_WINDOW_MS = 60_000;
const CLIENT_MAX_PER_WINDOW = 12;

const OUTBOUND_WINDOW_MS = 60_000;
const OUTBOUND_MAX_PER_WINDOW = 30; // total Instagram fetches/minute, across all users

interface Bucket {
  count: number;
  windowStart: number;
}

const clientBuckets = new Map<string, Bucket>();
let outboundBucket: Bucket = { count: 0, windowStart: 0 };

function sweepClientBuckets(now: number) {
  if (clientBuckets.size < 5000) return;
  for (const [key, bucket] of clientBuckets) {
    if (now - bucket.windowStart > CLIENT_WINDOW_MS) clientBuckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

function checkBucket(
  bucket: Bucket | undefined,
  windowMs: number,
  limit: number,
  now: number,
): { result: RateLimitResult; next: Bucket } {
  if (!bucket || now - bucket.windowStart >= windowMs) {
    return { result: { allowed: true, retryAfterSeconds: 0 }, next: { count: 1, windowStart: now } };
  }
  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.ceil((bucket.windowStart + windowMs - now) / 1000);
    return { result: { allowed: false, retryAfterSeconds }, next: bucket };
  }
  return {
    result: { allowed: true, retryAfterSeconds: 0 },
    next: { count: bucket.count + 1, windowStart: bucket.windowStart },
  };
}

export function checkClientRateLimit(
  identifier: string,
  limit: number = CLIENT_MAX_PER_WINDOW,
): RateLimitResult {
  const now = Date.now();
  sweepClientBuckets(now);
  const { result, next } = checkBucket(clientBuckets.get(identifier), CLIENT_WINDOW_MS, limit, now);
  clientBuckets.set(identifier, next);
  return result;
}

export function checkOutboundRateLimit(): RateLimitResult {
  const now = Date.now();
  const { result, next } = checkBucket(outboundBucket, OUTBOUND_WINDOW_MS, OUTBOUND_MAX_PER_WINDOW, now);
  outboundBucket = next;
  return result;
}
