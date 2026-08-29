/**
 * Parses Instagram's public profile page HTML into loosely-typed raw
 * fields. This is the single most fragile part of the project by design:
 * it depends on markup Instagram doesn't publish or version, can change
 * without notice, and gets no warning before it does. Every extraction
 * here is defensive — a missing or reshaped field degrades to `null`
 * rather than throwing, and the caller (`PublicWebStoryProvider`) treats
 * "nothing extractable" as a retrieval failure, never as license to guess.
 *
 * See docs/story-retrieval-limitations.md for what this can and can't do,
 * and why.
 */

export interface RawProfileData {
  /** From Open Graph tags — the most stable part of the page; these exist specifically for link-preview bots. */
  ogImage: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  /** From Instagram's embedded page-state JSON, when present and parseable. Internal field names, kept as-is. */
  fullName: string | null;
  biography: string | null;
  profilePicUrl: string | null;
  followerCount: number | null;
  followingCount: number | null;
  postCount: number | null;
  isPrivate: boolean | null;
  isVerified: boolean | null;
}

const OG_TAG_PATTERN = (property: string) =>
  new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']*)["']`, "i");

function extractOgTag(html: string, property: string): string | null {
  const match = html.match(OG_TAG_PATTERN(property));
  if (!match) return null;
  return decodeHtmlEntities(match[1]);
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Instagram embeds page-bootstrap state as one or more
 * `<script type="application/json" data-sjs>{...}</script>` blocks. We
 * don't assume which one holds profile data or what shape it's in — we
 * parse every such block as JSON, then walk the resulting tree looking
 * for an object that has the field signature of a profile record
 * (presence of `is_private` is a reasonably stable marker Instagram has
 * used for this for a long time, but this is a heuristic, not a contract).
 */
function findProfileRecord(html: string): Record<string, unknown> | null {
  // Instagram sometimes inserts extra attributes (e.g. data-content-len)
  // between type="application/json" and data-sjs — match on the presence
  // of both rather than an exact adjacent sequence.
  const blocks = html.matchAll(
    /<script type="application\/json"[^>]*\bdata-sjs>([\s\S]*?)<\/script>/g,
  );

  for (const block of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block[1]);
    } catch {
      continue;
    }
    // Instagram wraps this in a `require: [[module, fn, null, [args...]]]`
    // bootstrap envelope, which puts the actual profile record well past a
    // shallow depth — observed at depth 13 on the current markup.
    const found = findObjectWithKey(parsed, "is_private", 20);
    if (found) return found;
  }

  return null;
}

function findObjectWithKey(
  value: unknown,
  key: string,
  maxDepth: number,
  depth = 0,
): Record<string, unknown> | null {
  if (depth > maxDepth || value === null || typeof value !== "object") return null;

  if (!Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (key in obj) return obj;
  }

  const entries = Array.isArray(value) ? value : Object.values(value as object);
  for (const entry of entries) {
    const found = findObjectWithKey(entry, key, maxDepth, depth + 1);
    if (found) return found;
  }

  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function parseProfilePage(html: string): RawProfileData {
  const record = findProfileRecord(html);

  return {
    ogImage: extractOgTag(html, "image"),
    ogTitle: extractOgTag(html, "title"),
    ogDescription: extractOgTag(html, "description"),
    fullName: record ? asString(record.full_name) : null,
    biography: record ? asString(record.biography) : null,
    profilePicUrl: record ? asString(record.profile_pic_url ?? record.profile_pic_url_hd) : null,
    followerCount: record ? asNumber(record.follower_count) : null,
    followingCount: record ? asNumber(record.following_count) : null,
    postCount: record ? asNumber(record.media_count ?? record.all_media_count) : null,
    isPrivate: record ? asBoolean(record.is_private) : null,
    isVerified: record ? asBoolean(record.is_verified) : null,
  };
}

/** True when Instagram redirected/served a login or checkpoint wall instead of the profile itself. */
export function looksLikeAccessBlocked(finalUrl: string, html: string): boolean {
  if (/\/accounts\/login\/?/.test(finalUrl) || /\/challenge\//.test(finalUrl)) return true;
  if (html.length < 5_000 && /log ?in/i.test(html)) return true;
  return false;
}
