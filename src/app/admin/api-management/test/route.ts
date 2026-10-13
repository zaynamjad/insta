import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/admin-auth";
import { getAllApiKeys } from "@/lib/story/key-store";
import { isProviderId, PROVIDER_LABELS } from "@/lib/story/provider-settings";
import { getKeyBalance } from "@/lib/story/hikerapi-balance";
import { getScrapeCreatorsBalance } from "@/lib/story/scrapecreators-balance";
import { recordCredits } from "@/lib/story/provider-stats";

export const runtime = "nodejs";

/**
 * "Test connection" for either provider: checks every configured key
 * against the provider's balance endpoint and reports the result as a
 * dashboard notice. HikerAPI's `/sys/balance` is documented as free; this
 * only runs on an explicit button press, never automatically.
 */
export async function POST(req: NextRequest) {
  const session = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSessionToken(session)) {
    return redirectTo(req, { error: "Your session expired. Please sign in again." });
  }

  const provider = (await req.formData()).get("provider");
  if (!isProviderId(provider)) return redirectTo(req, { error: "Unknown provider." });

  const keys = await getAllApiKeys(provider);
  if (keys.length === 0) {
    return redirectTo(req, { error: `${PROVIDER_LABELS[provider]}: no API key configured.` });
  }

  const parts: string[] = [];
  let failed = false;
  for (let i = 0; i < keys.length; i++) {
    const tag = `key ${i + 1}`;
    if (provider === "hikerapi") {
      const r = await getKeyBalance(keys[i]);
      if (r.status === "ok") parts.push(`${tag} OK (${r.balance.requests.toLocaleString()} requests left)`);
      else {
        failed = true;
        parts.push(`${tag} ${r.status === "invalid" ? "rejected" : `failed (${r.message})`}`);
      }
    } else {
      const r = await getScrapeCreatorsBalance(keys[i]);
      if (r.status === "ok") {
        parts.push(`${tag} OK (${r.credits.toLocaleString()} credits)`);
        await recordCredits("scrapecreators", { remaining: r.credits });
      } else {
        failed = true;
        parts.push(`${tag} ${r.status === "invalid" ? "rejected" : `failed (${r.message})`}`);
      }
    }
  }

  const message = `${PROVIDER_LABELS[provider]} connection test: ${parts.join("; ")}`;
  return redirectTo(req, failed ? { error: message } : { notice: message });
}

function redirectTo(req: NextRequest, params: { error?: string; notice?: string }) {
  const url = new URL("/admin/api-management", req.url);
  if (params.error) url.searchParams.set("error", params.error);
  if (params.notice) url.searchParams.set("notice", params.notice);
  return NextResponse.redirect(url, 303);
}
