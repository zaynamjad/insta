import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPathname } from "@/i18n/navigation";
import { buildLanguageAlternates } from "@/i18n/alternates";
import { SITE_NAME } from "@/lib/site";

type Props = PageProps<"/[locale]/about">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AboutPage" });
  return buildMetadata({
    title: t("metaTitle", { siteName: SITE_NAME }),
    description: t("metaDescription", { siteName: SITE_NAME }),
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
        {t("h1", { siteName: SITE_NAME })}
      </h1>

      <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/80">
        <p>{t("intro", { siteName: SITE_NAME })}</p>
        <h2 className="mt-8 text-xl font-bold text-foreground">
          {t("whatWeDoTitle")}
        </h2>
        <p>{t("whatWeDoText")}</p>
        <h2 className="mt-8 text-xl font-bold text-foreground">
          {t("whatWeDontTitle")}
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>{t("dontItem1")}</li>
          <li>{t("dontItem2")}</li>
          <li>{t("dontItem3")}</li>
          <li>{t("dontItem4")}</li>
        </ul>
        <h2 className="mt-8 text-xl font-bold text-foreground">
          {t("independenceTitle")}
        </h2>
        <p>{t("independenceText", { siteName: SITE_NAME })}</p>
        <h2 className="mt-8 text-xl font-bold text-foreground">{t("questionsTitle")}</h2>
        <p>
          {t.rich("questionsText", {
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
            contactLink: (chunks) => (
              <Link href="/contact/" className="text-accent hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
