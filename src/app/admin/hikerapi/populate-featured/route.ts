import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/admin-auth";
import { HikerApiStoryProvider } from "@/lib/story/hikerapi-provider";
import { FEATURED_META } from "@/lib/story/featured-profiles";
import {
  getStoredFeaturedProfiles,
  writeStoredFeaturedProfiles,
  type StoredFeaturedProfile,
} from "@/lib/story/featured-profiles-store";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * ONE-OFF admin action, not a route the app calls itself: does a single
 * real HikerAPI lookup per `FEATURED_META` account (this is the one
 * deliberate, explicitly-requested use of HikerAPI credits in this whole
 * feature — the normal request path never calls HikerAPI for this data at
 * all, see featured-profiles.ts), re-hosts each avatar on Vercel Blob so
 * it survives Instagram's CDN URLs expiring, and writes the result to the
 * permanent Global Config store. Meant to be deleted again right after
 * use — see the commit that removes this file.
 */
export async function POST(req: NextRequest) {
  const session = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSessionToken(session)) {
    return NextResponse.json({ error: "Sign in to the dashboard first." }, { status: 401 });
  }

  // Optional { usernames: [...] } body — re-fetches just those accounts
  // and merges into the existing stored list, instead of redoing all 20
  // (and spending 20 more requests) to fix or add one.
  let only: Set<string> | null = null;
  try {
    const body = (await req.json()) as { usernames?: string[] };
    if (Array.isArray(body.usernames) && body.usernames.length > 0) {
      only = new Set(body.usernames);
    }
  } catch {
    // No/invalid JSON body — fine, means "do all of them".
  }

  const metaToFetch = only ? FEATURED_META.filter((m) => only!.has(m.username)) : FEATURED_META;

  const provider = new HikerApiStoryProvider();
  const results: Array<{ username: string; status: string; followers?: number | null; logoUrl?: string | null }> = [];
  const existing = await getStoredFeaturedProfiles();
  const toStore: StoredFeaturedProfile[] = existing.filter((p) => !metaToFetch.some((m) => m.username === p.username));

  for (const meta of metaToFetch) {
    try {
      const profile = await provider.getBasicProfile(meta.username);
      if (!profile) {
        results.push({ username: meta.username, status: "not_found" });
        continue;
      }

      const sourceImage = profile.profileImageHd ?? profile.profileImage;
      let logoUrl: string | null = null;

      if (sourceImage) {
        try {
          const imgRes = await fetch(sourceImage);
          if (imgRes.ok) {
            const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
            const ext = contentType.includes("png") ? "png" : "jpg";
            const bytes = Buffer.from(await imgRes.arrayBuffer());
            const blob = await put(`featured-profiles/${meta.username}.${ext}`, bytes, {
              access: "public",
              contentType,
              addRandomSuffix: false,
              allowOverwrite: true,
            });
            logoUrl = blob.url;
          }
        } catch (err) {
          console.error(`[populate-featured] image upload failed for ${meta.username}:`, err);
        }
      }

      toStore.push({
        username: meta.username,
        fullName: profile.fullName ?? meta.displayName,
        category: profile.category ?? meta.category,
        followers: profile.followers,
        isVerified: profile.isVerified,
        logoUrl,
        updatedAt: new Date().toISOString(),
      });

      results.push({ username: meta.username, status: "ok", followers: profile.followers, logoUrl });
    } catch (err) {
      results.push({
        username: meta.username,
        status: `error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  if (toStore.length > 0) {
    await writeStoredFeaturedProfiles(toStore);
  }

  return NextResponse.json({ storedCount: toStore.length, results });
}
