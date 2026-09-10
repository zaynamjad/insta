import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPathname } from "@/i18n/navigation";
import { buildLanguageAlternates } from "@/i18n/alternates";
import { SITE_NAME } from "@/lib/site";

type Props = PageProps<"/[locale]/disclaimer">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DisclaimerPage" });
  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: SITE_NAME }),
    path: "/disclaimer/",
    localizedPath: getPathname({ href: "/disclaimer", locale }),
    languageAlternates: buildLanguageAlternates("/disclaimer"),
  });
}

export default async function DisclaimerPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DisclaimerPage" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Breadcrumbs items={[{ name: t("breadcrumb"), path: "/disclaimer/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("h1")}
      </h1>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-xl font-bold text-foreground">{t("publicOnlyTitle")}</h2>
          <p className="mt-2">{t("publicOnlyText", { siteName: SITE_NAME })}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("noPasswordTitle")}</h2>
          <p className="mt-2">{t("noPasswordText", { siteName: SITE_NAME })}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("anonymityTitle")}</h2>
          <p className="mt-2">{t("anonymityText")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("affiliationTitle")}</h2>
          <p className="mt-2">{t("affiliationText", { siteName: SITE_NAME })}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("availabilityTitle")}</h2>
          <p className="mt-2">{t("availabilityText")}</p>
        </section>
      </div>
    </div>
  );
}
