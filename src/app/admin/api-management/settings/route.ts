import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/admin-auth";
import { getAllApiKeys } from "@/lib/story/key-store";
import {
  isProviderId,
  validateProviderSettings,
  writeProviderSettings,
  type ApiProviderSettings,
} from "@/lib/story/provider-settings";

export const runtime = "nodejs";

/**
 * Saves Primary provider, failover on/off and per-provider enable switches.
 * The Fallback is never submitted: it is always the other provider, so the
 * two can't be assigned the same role.
 */
export async function POST(req: NextRequest) {
  const session = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSessionToken(session)) {
    return redirectTo(req, { error: "Your session expired. Please sign in again." });
  }

  const form = await req.formData();
  const primary = form.get("primary");
  if (!isProviderId(primary)) return redirectTo(req, { error: "Choose a valid Primary provider." });

  const settings: ApiProviderSettings = {
    primary,
    fallbackEnabled: form.get("fallbackEnabled") === "on",
    enabled: {
      hikerapi: form.get("enabled_hikerapi") === "on",
      scrapecreators: form.get("enabled_scrapecreators") === "on",
    },
  };

  try {
    const [hiker, sc] = await Promise.all([getAllApiKeys("hikerapi"), getAllApiKeys("scrapecreators")]);
    const problem = validateProviderSettings(settings, {
      hikerapi: hiker.length > 0,
      scrapecreators: sc.length > 0,
    });
    if (problem) return redirectTo(req, { error: problem });

    await writeProviderSettings(settings);
  } catch (err) {
    return redirectTo(req, { error: err instanceof Error ? err.message : "Failed to save settings." });
  }

  return redirectTo(req, { notice: "Provider settings saved. They apply to the next request." });
}

function redirectTo(req: NextRequest, params: { error?: string; notice?: string }) {
  const url = new URL("/admin/api-management", req.url);
  if (params.error) url.searchParams.set("error", params.error);
  if (params.notice) url.searchParams.set("notice", params.notice);
  return NextResponse.redirect(url, 303);
}
