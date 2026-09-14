import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const proto = request.headers.get("x-forwarded-proto");

  const isWww = host.startsWith("www.");
  const isHttp = proto === "http";

  if (isWww || isHttp) {
    const cleanHost = host.replace(/^www\./i, "");
    const destination = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${cleanHost}`);
    return NextResponse.redirect(destination, 308);
  }

  return handleI18nRouting(request);
}

export const config = {
  // The trailing `|.*\..*` excludes any path with a file extension — every
  // static asset under `public/` (logo.png, mascot.png, etc.), not just
  // Next's own `_next/*` output. Without it, next-intl's middleware
  // rewrites those requests to add a locale prefix (e.g. `/en/logo.png`),
  // which doesn't exist as a route, so the asset 404s.
  matcher: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|opengraph-image|.*\\..*).*)",
};
