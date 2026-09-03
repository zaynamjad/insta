import type { NextRequest } from "next/server";
import { SITE_URL } from "@/lib/site";

export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Rejects requests whose Origin header is explicitly set to a different
 * site. Same-origin browser requests either omit Origin or send our own
 * origin; only a cross-site page trying to call this API directly would
 * send a mismatched one. Requests with no Origin header (plain server-side
 * calls, older browsers) are allowed through — rate limiting and username
 * validation still apply.
 */
export function isCrossSiteRequest(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  if (origin === SITE_URL) return false;
  if (process.env.NODE_ENV !== "production" && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    return false;
  }
  return true;
}
