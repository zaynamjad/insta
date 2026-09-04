import "server-only";
import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

/**
 * Shared Redis accessor for anything in this app that wants real
 * persistence (across deploys and serverless instances) instead of an
 * in-memory, per-instance cache. Lazily constructed so a build/render
 * without Redis env vars configured never crashes.
 *
 * Accepts both the `UPSTASH_REDIS_REST_*` names (Upstash's own
 * convention) and `KV_REST_API_*` (what Vercel's Marketplace Upstash
 * integration actually provisions) — the two diverged in practice, and
 * reading only one name silently makes this look unconfigured even with
 * Redis fully provisioned.
 */
export function getRedisClient(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}
