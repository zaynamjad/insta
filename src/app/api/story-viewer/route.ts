import { NextRequest, NextResponse } from "next/server";
import { lookupStory } from "@/lib/story/lookup";
import { validateUsername } from "@/lib/story/validation";
import { checkClientRateLimit } from "@/lib/story/rate-limit";
import type { StoryLookupResult } from "@/types/story";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 2_000; // this endpoint only ever needs a short username string

function getClientIp(req: NextRequest): string {
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
function isCrossSiteRequest(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  if (origin === SITE_URL) return false;
  if (process.env.NODE_ENV !== "production" && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    return false;
  }
  return true;
}

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  const body: StoryLookupResult = { status: "error", message };
  return NextResponse.json({ ...body, ...extra }, { status });
}

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return jsonError(403, "Cross-site requests are not allowed.");
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return jsonError(413, "Request too large.");
  }

  const ip = getClientIp(req);
  const rateLimit = checkClientRateLimit(ip);
  if (!rateLimit.allowed) {
    return jsonError(
      429,
      "Too many requests. Please wait a moment and try again.",
      { retryAfterSeconds: rateLimit.retryAfterSeconds },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid request body.");
  }

  const usernameInput =
    typeof body === "object" && body !== null && "username" in body
      ? (body as { username: unknown }).username
      : undefined;

  const { valid, error } = validateUsername(usernameInput);
  if (!valid) {
    return jsonError(400, error ?? "Invalid username.");
  }

  const result = await lookupStory(usernameInput);
  const status = result.status === "error" ? 502 : 200;
  return NextResponse.json(result, { status });
}

export async function GET() {
  return jsonError(405, "Use POST with a JSON body: { \"username\": string }.");
}
