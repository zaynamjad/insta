import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export function proxy(request: NextRequest) {
  return handleI18nRouting(request);
}

export const config = {
  // The trailing `|.*\..*` excludes any path with a file extension — every
  // static asset under `public/` (logo.png, mascot.png, etc.), not just
  // Next's own `_next/*` output. Without it, next-intl's middleware
  // rewrites those requests to add a locale prefix (e.g. `/en/logo.png`),
  // which doesn't exist as a route, so the asset 404s.
  matcher: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
};
