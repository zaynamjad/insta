import { getPathname } from "@/i18n/navigation";

/**
 * Sync the cookie next-intl's own middleware reads for locale detection
 * before navigating — without this, switching back to the default locale
 * (an unprefixed URL, e.g. "/") gets silently overridden by a stale
 * NEXT_LOCALE cookie from an earlier switch, redirecting straight back to
 * that old locale. Uses a full navigation (not next-intl's client-side
 * router) because <html lang>/dir> and the locale context live in the
 * root layout, above the [locale] segment — Next.js doesn't re-render
 * that layout on a soft transition between locale values, so a
 * client-side switch leaves client-only translated text stuck showing
 * the old locale even though the page content updates.
 */
export function switchLocale(pathname: string, nextLocale: string) {
  document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
  window.location.href = getPathname({ href: pathname, locale: nextLocale });
}
