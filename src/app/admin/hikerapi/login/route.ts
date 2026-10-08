import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { checkClientRateLimit } from "@/lib/story/rate-limit";
import { getClientIp } from "@/lib/story/request-guards";

export const runtime = "nodejs";

// A dedicated, namespaced bucket — deliberately not sharing the plain-IP
// bucket the public search/download endpoints use, so normal site traffic
// from this IP can't exhaust a would-be admin's login attempts, and a
// password-guessing run here doesn't throttle real visitors either.
const LOGIN_ATTEMPTS_PER_MINUTE = 5;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkClientRateLimit(`admin-login:${ip}`, LOGIN_ATTEMPTS_PER_MINUTE);
  if (!rateLimit.allowed) {
    return redirectWithError(req, "Too many attempts. Please wait a moment and try again.");
  }

  const form = await req.formData();
  const password = String(form.get("password") ?? "");

  if (!checkPassword(password)) {
    return redirectWithError(req, "Incorrect password.");
  }

  const res = NextResponse.redirect(new URL("/admin/hikerapi", req.url), 303);
  res.cookies.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/admin",
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}

function redirectWithError(req: NextRequest, message: string) {
  const url = new URL("/admin/hikerapi", req.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}
