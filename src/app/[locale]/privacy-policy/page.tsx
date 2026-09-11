import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPathname } from "@/i18n/navigation";
import { buildLanguageAlternates } from "@/i18n/alternates";
import { CONTACT_EMAIL } from "@/lib/site";

type Props = PageProps<"/[locale]/privacy-policy">;

const LAST_UPDATED = "August 25, 2026";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPolicyPage" });
  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/privacy-policy/",
    localizedPath: getPathname({ href: "/privacy-policy", locale }),
    languageAlternates: buildLanguageAlternates("/privacy-policy"),
  });
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPolicyPage" });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Breadcrumbs items={[{ name: t("breadcrumb"), path: "/privacy-policy/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("h1")}
      </h1>
      <p className="mt-3 text-sm text-foreground/50">
        {t("lastUpdated", { date: LAST_UPDATED })}
      </p>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground/80">
        <p>{t("intro1")}</p>
        <p>{t("intro2")}</p>
        <p>{t("intro3")}</p>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("collectTitle")}</h2>
          <p className="mt-2">{t("collectText1")}</p>
          <p className="mt-2">{t("collectText2")}</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>{t("collectItem1")}</li>
            <li>{t("collectItem2")}</li>
            <li>{t("collectItem3")}</li>
            <li>{t("collectItem4")}</li>
            <li>{t("collectItem5")}</li>
            <li>{t("collectItem6")}</li>
            <li>{t("collectItem7")}</li>
          </ul>
          <p className="mt-2">{t("collectText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("providedTitle")}</h2>
          <p className="mt-2">{t("providedText1")}</p>
          <p className="mt-2">{t("providedText2")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("publicContentTitle")}</h2>
          <p className="mt-2">{t("publicContentText1")}</p>
          <p className="mt-2">{t("publicContentText2")}</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>{t("publicContentItem1")}</li>
            <li>{t("publicContentItem2")}</li>
            <li>{t("publicContentItem3")}</li>
            <li>{t("publicContentItem4")}</li>
            <li>{t("publicContentItem5")}</li>
            <li>{t("publicContentItem6")}</li>
            <li>{t("publicContentItem7")}</li>
            <li>{t("publicContentItem8")}</li>
          </ul>
          <p className="mt-2">{t("publicContentText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("useTitle")}</h2>
          <p className="mt-2">{t("useIntro")}</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>{t("useItem1")}</li>
            <li>{t("useItem2")}</li>
            <li>{t("useItem3")}</li>
            <li>{t("useItem4")}</li>
            <li>{t("useItem5")}</li>
            <li>{t("useItem6")}</li>
            <li>{t("useItem7")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("cookiesTitle")}</h2>
          <p className="mt-2">{t("cookiesText1")}</p>
          <p className="mt-2">{t("cookiesText2")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("thirdPartyTitle")}</h2>
          <p className="mt-2">{t("thirdPartyText1")}</p>
          <p className="mt-2">{t("thirdPartyText2")}</p>
          <p className="mt-2">{t("thirdPartyText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("securityTitle")}</h2>
          <p className="mt-2">{t("securityText1")}</p>
          <p className="mt-2">{t("securityText2")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("childrenTitle")}</h2>
          <p className="mt-2">{t("childrenText1")}</p>
          <p className="mt-2">{t("childrenText2")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("externalLinksTitle")}</h2>
          <p className="mt-2">{t("externalLinksText1")}</p>
          <p className="mt-2">{t("externalLinksText2")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("choicesTitle")}</h2>
          <p className="mt-2">{t("choicesText1")}</p>
          <p className="mt-2">{t("choicesText2")}</p>
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
              termsLink: (chunks) => (
                <Link href="/terms/" className="text-accent hover:underline">
                  {chunks}
                </Link>
              ),
              disclaimerLink: (chunks) => (
                <Link href="/disclaimer/" className="text-accent hover:underline">
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
