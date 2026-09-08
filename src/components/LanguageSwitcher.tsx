"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, getPathname } from "@/i18n/navigation";
import { LOCALES } from "@/i18n/locales";

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    // Sync the cookie next-intl's own middleware reads for locale
    // detection before navigating — without this, switching back to the
    // default locale (an unprefixed URL, e.g. "/") gets silently
    // overridden by a stale NEXT_LOCALE cookie from an earlier switch,
    // redirecting straight back to that old locale.
    document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
    // A full navigation (not next-intl's client-side router) because
    // <html lang>/dir> and the locale context live in the root layout,
    // above the [locale] segment — Next.js doesn't re-render that layout
    // on a soft transition between locale values, so a client-side switch
    // leaves the switcher, dir, and any client-only translated text stuck
    // showing the old locale even though the page content updates.
    window.location.href = getPathname({ href: pathname, locale: nextLocale });
  }

  return (
    <div className="relative flex shrink-0 items-center">
      <label htmlFor="language-switcher" className="sr-only">
        {t("label")}
      </label>
      <select
        id="language-switcher"
        value={locale}
        onChange={handleChange}
        aria-label={t("label")}
        className="h-10 cursor-pointer appearance-none rounded-full border border-border bg-surface pl-3 pr-7 text-sm font-medium text-foreground/80 outline-none transition-colors hover:text-foreground"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.countryCode}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-2.5 text-foreground/50"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
