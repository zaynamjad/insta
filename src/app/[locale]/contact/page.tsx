import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadataWithOverrides } from "@/lib/admin/apply-overrides";
import { PageOverridesRenderer } from "@/components/admin/PageOverridesRenderer";
import { getPathname } from "@/i18n/navigation";
import { buildLanguageAlternates } from "@/i18n/alternates";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";

type Props = PageProps<"/[locale]/contact">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage" });
  return buildMetadataWithOverrides({
    title: t("metaTitle", { siteName: SITE_NAME }),
    description: t("metaDescription", { siteName: SITE_NAME }),
    path: "/contact/",
    localizedPath: getPathname({ href: "/contact", locale }),
    languageAlternates: buildLanguageAlternates("/contact"),
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage" });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <PageOverridesRenderer path="/contact/" />
      <Breadcrumbs items={[{ name: t("breadcrumb"), path: "/contact/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("h1")}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-foreground/75">
        {t("intro")}
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm font-semibold text-foreground/60">{t("emailLabel")}</p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-1 block text-lg font-semibold text-accent hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
      </div>

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
  );
}
