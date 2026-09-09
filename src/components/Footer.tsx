import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SITE_NAME, FOOTER_COMPANY_LINKS } from "@/lib/site";

export async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="mt-24 border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="flex flex-col items-center sm:items-start">
            <Image
              src="/logo.png"
              alt={SITE_NAME}
              width={500}
              height={250}
              className="logo-light h-12 w-auto"
            />
            <Image
              src="/logo-dark.png"
              alt={SITE_NAME}
              width={500}
              height={250}
              className="logo-dark h-12 w-auto"
            />
            <p className="mt-2 max-w-xs text-sm text-foreground/65">
              {t("tagline")}
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:justify-end">
              {FOOTER_COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/65 transition-colors hover:text-foreground"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Highlighted Disclaimer & Security Banner */}
        <div className="mt-10 rounded-2xl border border-accent/25 bg-accent/5 p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="flex items-start gap-3.5">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.002A11.959 11.959 0 0112 2.964zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <div className="space-y-2 text-xs leading-relaxed text-foreground/80 sm:text-sm">
              <p className="font-medium text-foreground">{t("disclaimer1", { siteName: SITE_NAME })}</p>
              <p className="font-medium text-foreground/90">{t("disclaimer2", { siteName: SITE_NAME })}</p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs font-medium text-foreground/50">
          {t("copyright", { year: new Date().getFullYear(), siteName: SITE_NAME })}
        </p>
      </div>
    </footer>
  );
}
