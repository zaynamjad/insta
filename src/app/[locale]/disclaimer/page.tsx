import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPathname } from "@/i18n/navigation";
import { buildLanguageAlternates } from "@/i18n/alternates";
import { CONTACT_EMAIL } from "@/lib/site";

type Props = PageProps<"/[locale]/disclaimer">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DisclaimerPage" });
  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/disclaimer/",
    localizedPath: getPathname({ href: "/disclaimer", locale }),
    languageAlternates: buildLanguageAlternates("/disclaimer"),
  });
}

export default async function DisclaimerPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DisclaimerPage" });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Breadcrumbs items={[{ name: t("breadcrumb"), path: "/disclaimer/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("h1")}
      </h1>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground/80">
        <p>{t("intro1")}</p>
        <p>{t("intro2")}</p>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("publicContentTitle")}</h2>
          <p className="mt-2">{t("publicContentText1")}</p>
          <p className="mt-2">{t("publicContentText2")}</p>
          <p className="mt-2">{t("publicContentText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("noAffiliationTitle")}</h2>
          <p className="mt-2">{t("noAffiliationText1")}</p>
          <p className="mt-2">{t("noAffiliationText2")}</p>
          <p className="mt-2">{t("noAffiliationText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("ownershipTitle")}</h2>
          <p className="mt-2">{t("ownershipText1")}</p>
          <p className="mt-2">{t("ownershipText2")}</p>
          <p className="mt-2">{t("ownershipText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("viewerTitle")}</h2>
          <p className="mt-2">{t("viewerText1")}</p>
          <p className="mt-2">{t("viewerText2")}</p>
          <p className="mt-2">{t("viewerText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("accuracyTitle")}</h2>
          <p className="mt-2">{t("accuracyText1")}</p>
          <p className="mt-2">{t("accuracyText2")}</p>
          <p className="mt-2">{t("accuracyText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("externalLinksTitle")}</h2>
          <p className="mt-2">{t("externalLinksText1")}</p>
          <p className="mt-2">{t("externalLinksText2")}</p>
          <p className="mt-2">{t("externalLinksText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("noGuaranteeTitle")}</h2>
          <p className="mt-2">{t("noGuaranteeText1")}</p>
          <p className="mt-2">{t("noGuaranteeText2")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("userResponsibilityTitle")}</h2>
          <p className="mt-2">{t("userResponsibilityText1")}</p>
          <p className="mt-2">{t("userResponsibilityText2")}</p>
          <p className="mt-2">{t("userResponsibilityText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("changesTitle")}</h2>
          <p className="mt-2">{t("changesText1")}</p>
          <p className="mt-2">{t("changesText2")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("contactTitle")}</h2>
          <p className="mt-2">{t("contactIntro")}</p>
          <div className="mt-3 rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm font-semibold text-foreground/60">Email</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-1 block break-all text-lg font-semibold text-accent hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
          <p className="mt-3">
            {t.rich("contactVisit", {
              contactLink: (chunks) => (
                <Link href="/contact/" className="text-accent hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
          <p className="mt-2">
            {t.rich("contactMore", {
              aboutLink: (chunks) => (
                <Link href="/about/" className="text-accent hover:underline">
                  {chunks}
                </Link>
              ),
              privacyLink: (chunks) => (
                <Link href="/privacy-policy/" className="text-accent hover:underline">
                  {chunks}
                </Link>
              ),
              termsLink: (chunks) => (
                <Link href="/terms/" className="text-accent hover:underline">
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
