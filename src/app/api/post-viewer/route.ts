import { NextRequest, NextResponse } from "next/server";
import { lookupPostByShortcode } from "@/lib/story/post-lookup";
import { extractPostShortcode } from "@/lib/story/post-url";
import { checkClientRateLimit } from "@/lib/story/rate-limit";
import { getClientIp, isCrossSiteRequest } from "@/lib/story/request-guards";
import { verifyTurnstileToken } from "@/lib/story/turnstile";
import type { PostLookupResult, PostsErrorCode } from "@/types/post";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 4_000;

function jsonError(
  status: number,
  code: PostsErrorCode,
  message: string,
  extra?: Record<string, unknown>,
) {
  const body: PostLookupResult = { status: "error", code, message };
  return NextResponse.json({ ...body, ...extra }, { status });
}

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return jsonError(403, "INVALID_REQUEST", "Cross-site requests are not allowed.");
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return jsonError(413, "INVALID_REQUEST", "Request too large.");
  }

  const ip = getClientIp(req);
  const rateLimit = checkClientRateLimit(ip);
  if (!rateLimit.allowed) {
    return jsonError(
      429,
      "RATE_LIMITED",
      "Too many requests. Please wait a moment and try again.",
      { retryAfterSeconds: rateLimit.retryAfterSeconds },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "INVALID_REQUEST", "Invalid request body.");
  }

  const urlInput =
    typeof body === "object" && body !== null && "url" in body
      ? (body as { url: unknown }).url
      : undefined;

  const turnstileToken =
    typeof body === "object" && body !== null && "turnstileToken" in body
      ? (body as { turnstileToken: unknown }).turnstileToken
      : undefined;

  if (typeof urlInput !== "string") {
    return jsonError(400, "INVALID_REQUEST", "Missing post URL.");
  }

  const shortcode = extractPostShortcode(urlInput);
  if (!shortcode) {
    return jsonError(400, "INVALID_REQUEST", "That doesn't look like an Instagram post or reel URL.");
  }

  if (!(await verifyTurnstileToken(turnstileToken, ip))) {
    return jsonError(403, "INVALID_REQUEST", "Verification failed. Please try again.");
  }

  const result = await lookupPostByShortcode(shortcode);
  const status = result.status === "error" ? 502 : 200;
  return NextResponse.json(result, { status });
}

export async function GET() {
  return jsonError(405, "INVALID_REQUEST", "Use POST with a JSON body: { \"url\": string }.");
}
