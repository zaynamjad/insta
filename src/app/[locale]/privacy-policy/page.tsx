import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPathname } from "@/i18n/navigation";
import { buildLanguageAlternates } from "@/i18n/alternates";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";

type Props = PageProps<"/[locale]/privacy-policy">;

const LAST_UPDATED = "August 25, 2026";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPolicyPage" });
  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: SITE_NAME }),
    path: "/privacy-policy/",
    localizedPath: getPathname({ href: "/privacy-policy", locale }),
    languageAlternates: buildLanguageAlternates("/privacy-policy"),
  });
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPolicyPage" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Breadcrumbs items={[{ name: t("breadcrumb"), path: "/privacy-policy/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("h1")}
      </h1>
      <p className="mt-3 text-sm text-foreground/50">
        {t("lastUpdated", { date: LAST_UPDATED })}
      </p>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-xl font-bold text-foreground">{t("overviewTitle")}</h2>
          <p className="mt-2">{t("overviewText", { siteName: SITE_NAME })}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("collectTitle")}</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>{t("collectUsernamesLabel")}</strong> {t("collectUsernamesText")}
            </li>
            <li>
              <strong>{t("collectTechnicalLabel")}</strong> {t("collectTechnicalText")}
            </li>
            <li>
              <strong>{t("collectAnalyticsLabel")}</strong> {t("collectAnalyticsText")}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("dontTitle")}</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>{t("dontItem1")}</li>
            <li>{t("dontItem2")}</li>
            <li>{t("dontItem3")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("cookiesTitle")}</h2>
          <p className="mt-2">{t("cookiesText")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("thirdPartyTitle")}</h2>
          <p className="mt-2">{t("thirdPartyText")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("advertisingTitle")}</h2>
          <p className="mt-2">
            {t.rich("advertisingText", {
              adsLink: (chunks) => (
                <a
                  href="https://adssettings.google.com/"
                  className="text-accent hover:underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("rightsTitle")}</h2>
          <p className="mt-2">{t("rightsText")}</p>
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
