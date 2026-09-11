import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SITE_NAME, FOOTER_COMPANY_LINKS } from "@/lib/site";

export async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="mt-12 border-t border-border bg-surface-muted sm:mt-20">
      <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 sm:py-14">
        <Link href="/" className="inline-flex flex-col items-center">
          <Image
            src="/logo.png"
            alt={SITE_NAME}
            width={500}
            height={250}
            className="logo-light h-12 w-auto sm:h-16"
          />
          <Image
            src="/logo-dark.png"
            alt={SITE_NAME}
            width={500}
            height={250}
            className="logo-dark h-12 w-auto sm:h-16"
          />
        </Link>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-foreground/65">
          {t("tagline")}
        </p>

        <nav aria-label="Footer" className="mt-6">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
            {FOOTER_COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-foreground/65 transition-colors hover:text-accent"
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mx-auto mt-8 h-px w-16 rounded-full brand-gradient sm:mt-10" />

        {/* Highlighted Disclaimer & Security Banner */}
        <div className="mt-8 rounded-2xl border border-accent/25 bg-accent/5 p-4 text-left shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-accent sm:h-5 sm:w-5"
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
            <div className="space-y-1.5 text-xs leading-relaxed text-foreground/80">
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
