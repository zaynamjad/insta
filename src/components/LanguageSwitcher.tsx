"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { LOCALES, getLocaleMeta } from "@/i18n/locales";
import { switchLocale } from "@/lib/switch-locale";
import { FlagIcon } from "@/components/FlagIcon";

/** Desktop-only trigger + popover; mobile gets the language list inline in MobileNav instead. */
export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    searchRef.current?.focus();

    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = getLocaleMeta(locale);
  const q = query.trim().toLowerCase();
  const filteredLocales = q
    ? LOCALES.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.nativeName.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q),
      )
    : LOCALES;

  return (
    <div ref={rootRef} className="relative hidden shrink-0 items-center md:flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("label")}
        className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface pl-3 pr-2.5 text-sm font-medium text-foreground/80 outline-none transition-colors hover:text-foreground"
      >
        <FlagIcon countryCode={current.countryCode} />
        <span>{current.displayCode ?? current.countryCode}</span>
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
          className={`text-foreground/50 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
          <div className="border-b border-border p-1.5">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
              className="w-full rounded-xl bg-surface-muted px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground/40"
            />
          </div>
          <ul role="listbox" aria-label={t("label")} className="max-h-72 overflow-y-auto p-1.5">
            {filteredLocales.length === 0 ? (
              <li className="px-3 py-2 text-sm text-foreground/50">{t("noResults")}</li>
            ) : (
              filteredLocales.map((l) => {
                const active = l.code === locale;
                return (
                  <li key={l.code} role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => switchLocale(pathname, l.code)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "brand-gradient text-white"
                          : "text-foreground/80 hover:bg-surface-muted"
                      }`}
                    >
                      <FlagIcon countryCode={l.countryCode} />
                      <span className="truncate">{l.nativeName}</span>
                      <span className="ml-auto shrink-0 text-xs text-foreground/40">
                        {l.displayCode ?? l.countryCode}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
