import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPathname } from "@/i18n/navigation";
import { buildLanguageAlternates } from "@/i18n/alternates";
import { CONTACT_EMAIL } from "@/lib/site";

type Props = PageProps<"/[locale]/contact">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage" });
  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/contact/",
    localizedPath: getPathname({ href: "/contact", locale }),
    languageAlternates: buildLanguageAlternates("/contact"),
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage" });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Breadcrumbs items={[{ name: t("breadcrumb"), path: "/contact/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("h1")}
      </h1>

      <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/80">
        <p>{t("intro1")}</p>
        <p>{t("intro2")}</p>

        <h2 className="mt-8 text-xl font-bold text-foreground">{t("getInTouchTitle")}</h2>
        <p>{t("getInTouchText")}</p>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm font-semibold text-foreground/60">{t("emailLabel")}</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-1 block break-all text-lg font-semibold text-accent hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
        <p className="text-sm text-foreground/60">{t("responseNote")}</p>

        <h2 className="mt-8 text-xl font-bold text-foreground">{t("questionsTitle")}</h2>
        <p>{t("questionsIntro")}</p>
        <p>{t("questionsAskIntro")}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>{t("askItem1")}</li>
          <li>{t("askItem2")}</li>
          <li>{t("askItem3")}</li>
          <li>{t("askItem4")}</li>
          <li>{t("askItem5")}</li>
          <li>{t("askItem6")}</li>
          <li>{t("askItem7")}</li>
        </ul>
        <p className="text-sm font-medium text-foreground">{t("questionsWarning")}</p>

        <h2 className="mt-8 text-xl font-bold text-foreground">{t("availabilityTitle")}</h2>
        <p>{t("availabilityText1")}</p>
        <p>{t("availabilityText2")}</p>

        <h2 className="mt-8 text-xl font-bold text-foreground">{t("helpfulTitle")}</h2>
        <p>{t("helpfulIntro")}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Link href="/about/" className="font-semibold text-accent hover:underline">
              {t("helpfulAboutLabel")}
            </Link>{" "}
            — {t("helpfulAboutText")}
          </li>
          <li>
            <Link href="/privacy-policy/" className="font-semibold text-accent hover:underline">
              {t("helpfulPrivacyLabel")}
            </Link>{" "}
            — {t("helpfulPrivacyText")}
          </li>
          <li>
            <Link href="/terms/" className="font-semibold text-accent hover:underline">
              {t("helpfulTermsLabel")}
            </Link>{" "}
            — {t("helpfulTermsText")}
          </li>
          <li>
            <Link href="/disclaimer/" className="font-semibold text-accent hover:underline">
              {t("helpfulDisclaimerLabel")}
            </Link>{" "}
            — {t("helpfulDisclaimerText")}
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-bold text-foreground">{t("contactInfoTitle")}</h2>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm font-semibold text-foreground/60">{t("emailLabel")}</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-1 block break-all text-lg font-semibold text-accent hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
        <p>{t("closingText")}</p>

        <p className="mt-8 text-sm text-foreground/55">
          {t.rich("privacyNote", {
            privacyLink: (chunks) => (
              <Link href="/privacy-policy/" className="text-accent hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
