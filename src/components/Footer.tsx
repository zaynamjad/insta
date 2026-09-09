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
            <p className="mt-1 max-w-xs text-xs text-foreground/45">
              {t("independenceNote")}
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

        <div className="mt-10 space-y-3 border-t border-border pt-6 text-xs leading-relaxed text-foreground/55">
          <p>{t("disclaimer1", { siteName: SITE_NAME })}</p>
          <p>{t("disclaimer2", { siteName: SITE_NAME })}</p>
        </div>

        <p className="mt-6 text-xs text-foreground/45">
          {t("copyright", { year: new Date().getFullYear(), siteName: SITE_NAME })}
        </p>
      </div>
    </footer>
  );
}
