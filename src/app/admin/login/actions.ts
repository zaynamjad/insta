"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  checkAdminCredentials,
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/admin/auth";

/** Only ever allow redirecting back to a same-site relative path — never an absolute/protocol-relative URL. */
function safeRedirectTarget(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export async function loginAction(formData: FormData): Promise<void> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirectTarget(formData.get("redirect"));

  if (!checkAdminCredentials(username, password)) {
    const params = new URLSearchParams({ redirect: redirectTo, error: "1" });
    redirect(`/admin/login/?${params.toString()}`);
  }

  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(redirectTo);
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login/");
}
