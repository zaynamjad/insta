"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { setPageSettings, SettingsStoreNotConfiguredError } from "@/lib/admin/settings-store";
import { getRegistryEntry } from "@/lib/admin/page-registry";
import type { PageSeoSettings } from "@/types/page-settings";

export interface SaveResult {
  ok: boolean;
  message: string;
}

export async function saveSettingsAction(
  path: string,
  settings: PageSeoSettings,
): Promise<SaveResult> {
  // Independent re-check — the page this action is called from is itself
  // gated (by proxy.ts and by the page's own isAdminAuthenticated() call),
  // but Server Actions are separately reachable POST endpoints and must
  // never rely solely on the caller having been authenticated.
  if (!(await isAdminAuthenticated())) {
    return { ok: false, message: "Not authenticated." };
  }

  if (!getRegistryEntry(path)) {
    return { ok: false, message: "Unrecognized page path." };
  }

  if (settings.schemaJsonLd.trim()) {
    try {
      JSON.parse(settings.schemaJsonLd);
    } catch {
      return { ok: false, message: "Schema JSON-LD is not valid JSON. Fix it before saving." };
    }
  }

  const toSave: PageSeoSettings = { ...settings, updatedAt: new Date().toISOString() };

  try {
    await setPageSettings(path, toSave);
  } catch (err) {
    if (err instanceof SettingsStoreNotConfiguredError) {
      return {
        ok: false,
        message: "Storage isn't connected yet. Finish the Upstash Redis setup, then retry.",
      };
    }
    console.error("[admin] failed to save page settings:", err);
    return { ok: false, message: "Failed to save. Please try again." };
  }

  revalidatePath(path);
  return { ok: true, message: "Saved. The live page has been updated." };
}
