"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { NAV_LINKS } from "@/lib/site";
import { LOCALES } from "@/i18n/locales";
import { switchLocale } from "@/lib/switch-locale";
import { FlagIcon } from "@/components/FlagIcon";

export function MobileNav() {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close on navigation — adjusting state during render (not in an effect)
  // avoids the extra render-then-effect-then-render cascade; see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

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
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground/80 active:scale-95"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
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
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-4 py-3.5 text-base font-medium text-foreground/80 active:bg-surface-muted"
                >
                  {t(`Nav.${link.key}`)}
                </Link>
              ))}

              <p className="mt-4 px-4 text-xs font-semibold uppercase tracking-wide text-foreground/45">
                {t("LanguageSwitcher.label")}
              </p>
              <div className="mt-2 grid grid-cols-4 gap-2 px-4 pb-2">
                {LOCALES.map((l) => {
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
                })}
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
