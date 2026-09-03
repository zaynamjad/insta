import { NextRequest, NextResponse } from "next/server";
import { checkClientRateLimit } from "@/lib/story/rate-limit";
import { getClientIp } from "@/lib/story/request-guards";

export const runtime = "nodejs";

const FETCH_TIMEOUT_MS = 20_000;
const MAX_DOWNLOAD_BYTES = 60_000_000; // generous headroom for a short story/reel video

/**
 * Instagram CDN hostnames only — this proxy exists purely to add a
 * Content-Disposition header so the browser saves a file instead of
 * navigating to it (the `download` attribute isn't honored cross-origin).
 * It must never become a general-purpose URL fetcher: the allowlist is
 * this route's entire SSRF boundary.
 */
const ALLOWED_HOST_PATTERN = /^([a-z0-9-]+\.)+(cdninstagram\.com|fbcdn\.net)$/i;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkClientRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  }

  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url parameter." }, { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOST_PATTERN.test(target.hostname)) {
    return NextResponse.json({ error: "Only Instagram media URLs can be downloaded." }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(target, { signal: controller.signal, cache: "no-store" });
  } catch {
    clearTimeout(timer);
    return NextResponse.json({ error: "Failed to reach media source." }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Media source returned an unexpected status." }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const extension = contentType.includes("video") ? "mp4" : "jpg";
  const filename = `instagram-${Date.now()}.${extension}`;

  const reader = upstream.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_DOWNLOAD_BYTES) {
      await reader.cancel();
      return NextResponse.json({ error: "File exceeded the download size limit." }, { status: 502 });
    }
    chunks.push(value);
  }

  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(received),
      "Cache-Control": "no-store",
    },
  });
}
