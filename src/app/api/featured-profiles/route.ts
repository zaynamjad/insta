import { NextRequest, NextResponse } from "next/server";
import { getFeaturedProfiles } from "@/lib/story/featured-profiles";
import { checkClientRateLimit } from "@/lib/story/rate-limit";
import { getClientIp } from "@/lib/story/request-guards";

export const runtime = "nodejs";

/**
 * Serves the homepage's decorative featured-profiles carousel as client
 * data instead of server-rendering it into the page. The old approach
 * (`await getFeaturedProfiles()` directly in the page component) got
 * executed by Next.js during static generation — once per locale, on
 * every single build/deploy — which meant HikerAPI credits were spent
 * just from pushing code, with zero real visitors involved. Moving the
 * fetch behind a route handler means it only ever runs for an actual
 * browser hit, and `getFeaturedProfiles`'s own Redis cache (12h TTL)
 * still caps how often that turns into a real HikerAPI call.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkClientRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const profiles = await getFeaturedProfiles();
  return NextResponse.json(
    { profiles },
    {
      headers: {
        // Short browser/CDN cache on top of the 12h Redis cache, so a burst
        // of page loads doesn't turn into a burst of function invocations.
        "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
      },
    },
  );
}
