"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { LOCALES, getLocaleMeta } from "@/i18n/locales";
import { switchLocale } from "@/lib/switch-locale";
import { FlagIcon } from "@/components/FlagIcon";

export function MobileNav() {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [langQuery, setLangQuery] = useState("");
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close on navigation — adjusting state during render (not in an effect)
  // avoids the extra render-then-effect-then-render cascade; see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  const current = getLocaleMeta(locale);

  const langQ = langQuery.trim().toLowerCase();
  const filteredLocales = langQ
    ? LOCALES.filter(
        (l) =>
          l.name.toLowerCase().includes(langQ) ||
          l.nativeName.toLowerCase().includes(langQ) ||
          l.code.toLowerCase().includes(langQ),
      )
    : LOCALES;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? t("MobileNav.closeMenu") : t("MobileNav.openMenu")}
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-medium text-foreground/80 active:scale-95"
      >
        <FlagIcon countryCode={current.countryCode} className="h-5 w-7 rounded-[3px] object-cover" />
        <span>{current.displayCode ?? current.countryCode}</span>
      </button>

      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-16 z-30 bg-black/30"
          />
          <div
            id="mobile-nav-panel"
            className="fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border bg-background shadow-lg"
          >
            <nav className="flex flex-col px-4 py-3">
              <Link
                href="/"
                className="brand-gradient mb-2 rounded-xl px-4 py-3.5 text-center text-base font-semibold text-white"
              >
                {t("Header.viewStories")}
              </Link>

              <p className="mt-2 px-4 text-xs font-semibold uppercase tracking-wide text-foreground/45">
                {t("LanguageSwitcher.label")}
              </p>
              <div className="mt-2 px-4">
                <input
                  type="text"
                  value={langQuery}
                  onChange={(e) => setLangQuery(e.target.value)}
                  placeholder={t("LanguageSwitcher.search")}
                  aria-label={t("LanguageSwitcher.search")}
                  className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-foreground/40"
                />
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 px-4 pb-2">
                {filteredLocales.length === 0 ? (
                  <p className="col-span-4 py-2 text-center text-sm text-foreground/50">
                    {t("LanguageSwitcher.noResults")}
                  </p>
                ) : (
                  filteredLocales.map((l) => {
                    const active = l.code === locale;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        aria-current={active}
                        onClick={() => switchLocale(pathname, l.code)}
                        className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors ${
                          active
                            ? "brand-gradient border-transparent text-white"
                            : "border-border text-foreground/75 active:bg-surface-muted"
                        }`}
                      >
                        <FlagIcon countryCode={l.countryCode} />
                        {l.displayCode ?? l.countryCode}
                      </button>
                    );
                  })
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
