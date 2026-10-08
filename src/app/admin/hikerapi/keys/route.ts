import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/admin-auth";
import { getStoredKeys, writeStoredKeys, type StoredHikerApiKey } from "@/lib/story/key-store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSessionToken(session)) {
    return redirectWithError(req, "Your session expired. Please sign in again.");
  }

  const form = await req.formData();
  const intent = String(form.get("intent") ?? "");

  try {
    const current = await getStoredKeys();

    if (intent === "add") {
      const label = String(form.get("label") ?? "").trim();
      const key = String(form.get("key") ?? "").trim();
      if (!key) return redirectWithError(req, "Key value is required.");

      const next: StoredHikerApiKey[] = [
        ...current,
        {
          id: crypto.randomUUID(),
          label: label || `Key ${current.length + 1}`,
          key,
          addedAt: new Date().toISOString(),
        },
      ];
      await writeStoredKeys(next);
    } else if (intent === "replace") {
      const id = String(form.get("id") ?? "");
      const label = String(form.get("label") ?? "").trim();
      const key = String(form.get("key") ?? "").trim();
      if (!key) return redirectWithError(req, "Key value is required.");

      const next = current.map((k) => (k.id === id ? { ...k, label: label || k.label, key } : k));
      await writeStoredKeys(next);
    } else if (intent === "remove") {
      const id = String(form.get("id") ?? "");
      const next = current.filter((k) => k.id !== id);
      await writeStoredKeys(next);
    } else {
      return redirectWithError(req, "Unknown action.");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update the key store.";
    return redirectWithError(req, message);
  }

  return NextResponse.redirect(new URL("/admin/hikerapi", req.url), 303);
}

function redirectWithError(req: NextRequest, message: string) {
  const url = new URL("/admin/hikerapi", req.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}
