/**
 * Sync the cookie next-intl's own middleware reads for locale detection.
 * Without this, switching back to the default locale (an unprefixed URL,
 * e.g. "/") gets silently overridden by a stale NEXT_LOCALE cookie from an
 * earlier switch, redirecting straight back to that old locale.
 *
 * Called from the `onClick` of a real `<a href="...">` to the target
 * locale's URL (not a `<button>` + JS-only redirect) so the link stays a
 * plain, crawlable anchor — search engines only follow `<a href>` links,
 * not ones that depend on a script to navigate. The cookie write is
 * synchronous, so it lands before the browser's own default navigation
 * for that same click proceeds; we don't call `preventDefault()`, so a
 * full page load still happens (needed because `<html lang>`/`dir` and
 * the locale context live in the root layout, above the `[locale]`
 * segment — Next.js doesn't re-render that layout on a soft transition
 * between locale values, so a client-side switch would leave client-only
 * translated text stuck showing the old locale even after the URL changes).
 */
export function setLocaleCookie(nextLocale: string) {
  document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
}
