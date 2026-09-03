import { NextRequest, NextResponse } from "next/server";
import { lookupPosts } from "@/lib/story/posts-lookup";
import { validateUsername } from "@/lib/story/validation";
import { checkClientRateLimit } from "@/lib/story/rate-limit";
import { getClientIp, isCrossSiteRequest } from "@/lib/story/request-guards";
import type { PostsLookupResult, PostsErrorCode } from "@/types/post";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 2_000; // this endpoint only ever needs a short username string

function jsonError(
  status: number,
  code: PostsErrorCode,
  message: string,
  extra?: Record<string, unknown>,
) {
  const body: PostsLookupResult = { status: "error", code, message };
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

  const usernameInput =
    typeof body === "object" && body !== null && "username" in body
      ? (body as { username: unknown }).username
      : undefined;

  const { valid, error } = validateUsername(usernameInput);
  if (!valid) {
    return jsonError(400, "INVALID_USERNAME", error ?? "Invalid username.");
  }

  const result = await lookupPosts(usernameInput);
  const status = result.status === "error" ? 502 : 200;
  return NextResponse.json(result, { status });
}

export async function GET() {
  return jsonError(405, "INVALID_REQUEST", "Use POST with a JSON body: { \"username\": string }.");
}
