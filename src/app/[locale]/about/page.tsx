import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPathname } from "@/i18n/navigation";
import { buildLanguageAlternates } from "@/i18n/alternates";
import { CONTACT_EMAIL } from "@/lib/site";

type Props = PageProps<"/[locale]/about">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AboutPage" });
  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/about/",
    localizedPath: getPathname({ href: "/about", locale }),
    languageAlternates: buildLanguageAlternates("/about"),
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AboutPage" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Breadcrumbs items={[{ name: t("breadcrumb"), path: "/about/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("h1")}
      </h1>

      <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/80">
        <p>{t("intro1")}</p>
        <p>{t("intro2")}</p>
        <p>{t("intro3")}</p>

        <h2 className="mt-8 text-xl font-bold text-foreground">{t("storyTitle")}</h2>
        <p>{t("storyText1")}</p>
        <p>{t("storyText2")}</p>
        <p>{t("storyText3")}</p>
        <p>{t("storyText4")}</p>

        <h2 className="mt-8 text-xl font-bold text-foreground">{t("whatIsTitle")}</h2>
        <p>{t("whatIsText1")}</p>
        <p>{t("whatIsText2")}</p>
        <p>
          {t.rich("whatIsText3", {
            storyViewerLink: (chunks) => (
              <Link href="/" className="text-accent hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </p>

        <h2 className="mt-8 text-xl font-bold text-foreground">{t("exploreTitle")}</h2>
        <p>{t("exploreIntro")}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>{t("exploreItem1")}</li>
          <li>{t("exploreItem2")}</li>
          <li>{t("exploreItem3")}</li>
          <li>{t("exploreItem4")}</li>
          <li>{t("exploreItem5")}</li>
          <li>{t("exploreItem6")}</li>
          <li>{t("exploreItem7")}</li>
          <li>{t("exploreItem8")}</li>
        </ul>
        <p className="text-sm text-foreground/60">{t("exploreNote")}</p>

        <h2 className="mt-8 text-xl font-bold text-foreground">{t("noLoginTitle")}</h2>
        <p>{t("noLoginText1")}</p>
        <p>{t("noLoginText2")}</p>
        <p>{t("noLoginText3")}</p>

        <h2 className="mt-8 text-xl font-bold text-foreground">{t("privacyTitle")}</h2>
        <p>{t("privacyText1")}</p>
        <p>{t("privacyText2")}</p>
        <p>
          {t.rich("privacyText3", {
            privacyLink: (chunks) => (
              <Link href="/privacy-policy/" className="text-accent hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </p>

        <h2 className="mt-8 text-xl font-bold text-foreground">{t("experienceTitle")}</h2>
        <p>{t("experienceText1")}</p>
        <p>{t("experienceText2")}</p>

        <h2 className="mt-8 text-xl font-bold text-foreground">{t("commitmentTitle")}</h2>
        <p>{t("commitmentText1")}</p>
        <p>{t("commitmentText2")}</p>
        <p>
          {t.rich("commitmentText3", {
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

        <h2 className="mt-8 text-xl font-bold text-foreground">{t("contactTitle")}</h2>
        <p>{t("contactText1")}</p>
        <p>
          {t.rich("contactText2", {
            contactLink: (chunks) => (
              <Link href="/contact/" className="text-accent hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="break-all font-medium text-accent hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
        <p>{t("contactText3")}</p>
      </div>
    </div>
  );
}
