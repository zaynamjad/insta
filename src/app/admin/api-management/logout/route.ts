import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/api-management", req.url), 303);
  res.cookies.delete({ name: ADMIN_SESSION_COOKIE, path: "/admin" });
  return res;
}
