import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin/session";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

/**
 * First line of defense for `/.../admin-edit` pages — redirects to login
 * when there's no valid session cookie. This is not the *only* line of
 * defense: the admin-edit page itself re-checks (`isAdminAuthenticated()`
 * in `lib/admin/auth.ts`), and every Server Action that mutates settings
 * re-checks again independently, per Next.js's own guidance that a Proxy
 * matcher change should never be the sole thing standing between a
 * request and a privileged mutation.
 *
 * Admin routes (`/admin*` and any `.../admin-edit` page) are deliberately
 * kept outside of i18n routing — the editor manages the site's canonical
 * (English) content only, so these URLs are never locale-prefixed and
 * never rewritten by `handleI18nRouting`. An authenticated `.../admin-edit`
 * request is instead rewritten (URL bar unchanged) to the static
 * `seo-editor-internal` segment, since that's where the catch-all page that
 * handles it now lives — see the comment on that page for why. (Not
 * `_admin-edit` or similar: a leading-underscore folder is a Next.js
 * "private folder" convention and gets excluded from routing entirely.)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminEdit = /\/admin-edit\/?$/.test(pathname);
  const isAdminRoute = isAdminEdit || pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminEdit) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!verifySessionToken(token)) {
      const loginUrl = new URL("/admin/login/", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.rewrite(new URL(`/seo-editor-internal${pathname}`, request.url));
  }

  if (isAdminRoute) {
    return NextResponse.next();
  }

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
