import { NextRequest, NextResponse } from "next/server";
import { checkClientRateLimit } from "@/lib/story/rate-limit";
import { getClientIp } from "@/lib/story/request-guards";

export const runtime = "nodejs";

const FETCH_TIMEOUT_MS = 20_000;
const MAX_DOWNLOAD_BYTES = 60_000_000; // generous headroom for a short story/reel video

/**
 * Instagram CDN hostnames only. Two uses: (1) downloads — add a
 * Content-Disposition header so the browser saves a file instead of
 * navigating to it, since the `download` attribute isn't honored
 * cross-origin; (2) `inline=1` — serve an image back for display when the
 * CDN won't let the browser load it directly (see the `inline` comment
 * below). It must never become a general-purpose URL fetcher: the
 * allowlist is this route's entire SSRF boundary.
 */
const ALLOWED_HOST_PATTERN = /^([a-z0-9-]+\.)+(cdninstagram\.com|fbcdn\.net)$/i;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkClientRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  }

  // "inline" is for displaying an image in the page (e.g. the HD profile
  // picture, which Instagram's CDN blocks from loading directly cross-origin
  // via <img src> even though the exact same URL fetches fine server-side)
  // — same allowlist/size/timeout guards as a download, just without forcing
  // a file save and with real caching instead of no-store.
  const inline = req.nextUrl.searchParams.get("inline") === "1";

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

  if (inline && !contentType.startsWith("image/")) {
    return NextResponse.json({ error: "inline mode only supports image responses." }, { status: 400 });
  }

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
      "Content-Length": String(received),
      ...(inline
        ? { "Cache-Control": "private, max-age=3600" }
        : {
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store",
          }),
    },
  });
}
