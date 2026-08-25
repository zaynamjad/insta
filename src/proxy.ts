import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin/session";

/**
 * First line of defense for `/.../admin-edit` pages — redirects to login
 * when there's no valid session cookie. This is not the *only* line of
 * defense: the admin-edit page itself re-checks (`isAdminAuthenticated()`
 * in `lib/admin/auth.ts`), and every Server Action that mutates settings
 * re-checks again independently, per Next.js's own guidance that a Proxy
 * matcher change should never be the sole thing standing between a
 * request and a privileged mutation.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!/\/admin-edit\/?$/.test(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (verifySessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login/", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};
