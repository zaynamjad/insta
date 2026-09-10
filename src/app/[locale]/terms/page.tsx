import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPathname } from "@/i18n/navigation";
import { buildLanguageAlternates } from "@/i18n/alternates";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";

type Props = PageProps<"/[locale]/terms">;

const LAST_UPDATED = "August 25, 2026";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TermsPage" });
  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: SITE_NAME }),
    path: "/terms/",
    localizedPath: getPathname({ href: "/terms", locale }),
    languageAlternates: buildLanguageAlternates("/terms"),
  });
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TermsPage" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Breadcrumbs items={[{ name: t("breadcrumb"), path: "/terms/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("h1")}
      </h1>
      <p className="mt-3 text-sm text-foreground/50">
        {t("lastUpdated", { date: LAST_UPDATED })}
      </p>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-xl font-bold text-foreground">{t("acceptanceTitle")}</h2>
          <p className="mt-2">{t("acceptanceText", { siteName: SITE_NAME })}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("permittedTitle")}</h2>
          <p className="mt-2">{t("permittedIntro", { siteName: SITE_NAME })}</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>{t("permittedItem1")}</li>
            <li>{t("permittedItem2")}</li>
            <li>{t("permittedItem3")}</li>
            <li>{t("permittedItem4")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("affiliationTitle")}</h2>
          <p className="mt-2">{t("affiliationText", { siteName: SITE_NAME })}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("availabilityTitle")}</h2>
          <p className="mt-2">{t("availabilityText")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("liabilityTitle")}</h2>
          <p className="mt-2">{t("liabilityText", { siteName: SITE_NAME })}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("changesTitle")}</h2>
          <p className="mt-2">{t("changesText")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("contactTitle")}</h2>
          <p className="mt-2">
            {t.rich("contactText", {
              email: () => (
                <a href={`mailto:${CONTACT_EMAIL}`} className="break-all text-accent hover:underline">
                  {CONTACT_EMAIL}
                </a>
              ),
              contactLink: (chunks) => (
                <Link href="/contact/" className="text-accent hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </section>
      </div>
    </div>
  );
}
