/**
 * Extracts the shortcode from a pasted Instagram post/reel/IGTV URL, e.g.
 * `https://www.instagram.com/p/Dc07ERKiObF/?utm_source=...` -> "Dc07ERKiObF".
 * Returns null for anything else (including profile URLs and plain
 * usernames) — those stay on the existing username-lookup path.
 */
export function extractPostShortcode(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(
    /instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i,
  );
  return match ? match[1] : null;
}

/**
 * Recognizes a pasted Instagram Highlight link, e.g.
 * `https://www.instagram.com/stories/highlights/17862157122069098/` and
 * returns it normalized to the canonical form HikerAPI's
 * `/v1/highlight/by/url` expects. Returns null for anything else.
 */
export function extractHighlightUrl(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(/instagram\.com\/stories\/highlights\/(\d+)/i);
  return match ? `https://www.instagram.com/stories/highlights/${match[1]}/` : null;
}
