"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALES } from "@/i18n/locales";

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
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
        disabled={isPending}
        aria-label={t("label")}
        className="h-10 cursor-pointer appearance-none rounded-full border border-border bg-surface pl-3 pr-7 text-sm font-medium text-foreground/80 outline-none transition-colors hover:text-foreground disabled:opacity-60"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.nativeName} ({l.countryCode})
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
