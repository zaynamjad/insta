import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPathname } from "@/i18n/navigation";
import { buildLanguageAlternates } from "@/i18n/alternates";
import { CONTACT_EMAIL } from "@/lib/site";

type Props = PageProps<"/[locale]/terms">;

const LAST_UPDATED = "August 25, 2026";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TermsPage" });
  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/terms/",
    localizedPath: getPathname({ href: "/terms", locale }),
    languageAlternates: buildLanguageAlternates("/terms"),
  });
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TermsPage" });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Breadcrumbs items={[{ name: t("breadcrumb"), path: "/terms/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("h1")}
      </h1>
      <p className="mt-3 text-sm text-foreground/50">
        {t("lastUpdated", { date: LAST_UPDATED })}
      </p>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground/80">
        <p>{t("intro1")}</p>
        <p>{t("intro2")}</p>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("useTitle")}</h2>
          <p className="mt-2">{t("useText1")}</p>
          <p className="mt-2">{t("useText2")}</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>{t("useItem1")}</li>
            <li>{t("useItem2")}</li>
            <li>{t("useItem3")}</li>
            <li>{t("useItem4")}</li>
            <li>{t("useItem5")}</li>
            <li>{t("useItem6")}</li>
            <li>{t("useItem7")}</li>
            <li>{t("useItem8")}</li>
          </ul>
          <p className="mt-2">{t("useText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("publicOnlyTitle")}</h2>
          <p className="mt-2">{t("publicOnlyText1")}</p>
          <p className="mt-2">{t("publicOnlyText2")}</p>
          <p className="mt-2">{t("publicOnlyText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("noLoginTitle")}</h2>
          <p className="mt-2">{t("noLoginText1")}</p>
          <p className="mt-2">{t("noLoginText2")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("permittedTitle")}</h2>
          <p className="mt-2">{t("permittedText1")}</p>
          <p className="mt-2">{t("permittedText2")}</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>{t("permittedItem1")}</li>
            <li>{t("permittedItem2")}</li>
            <li>{t("permittedItem3")}</li>
            <li>{t("permittedItem4")}</li>
            <li>{t("permittedItem5")}</li>
            <li>{t("permittedItem6")}</li>
            <li>{t("permittedItem7")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("downloadsTitle")}</h2>
          <p className="mt-2">{t("downloadsText1")}</p>
          <p className="mt-2">{t("downloadsText2")}</p>
          <p className="mt-2">{t("downloadsText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("copyrightTitle")}</h2>
          <p className="mt-2">{t("copyrightText1")}</p>
          <p className="mt-2">{t("copyrightText2")}</p>
          <p className="mt-2">{t("copyrightText3")}</p>
          <p className="mt-2">{t("copyrightText4")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("thirdPartyPlatformTitle")}</h2>
          <p className="mt-2">{t("thirdPartyPlatformText1")}</p>
          <p className="mt-2">{t("thirdPartyPlatformText2")}</p>
          <p className="mt-2">{t("thirdPartyPlatformText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("contentAvailabilityTitle")}</h2>
          <p className="mt-2">{t("contentAvailabilityText1")}</p>
          <p className="mt-2">{t("contentAvailabilityText2")}</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>{t("contentAvailabilityItem1")}</li>
            <li>{t("contentAvailabilityItem2")}</li>
            <li>{t("contentAvailabilityItem3")}</li>
            <li>{t("contentAvailabilityItem4")}</li>
            <li>{t("contentAvailabilityItem5")}</li>
            <li>{t("contentAvailabilityItem6")}</li>
          </ul>
          <p className="mt-2">{t("contentAvailabilityText3")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("accuracyTitle")}</h2>
          <p className="mt-2">{t("accuracyText1")}</p>
          <p className="mt-2">{t("accuracyText2")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("serviceAvailabilityTitle")}</h2>
          <p className="mt-2">{t("serviceAvailabilityText1")}</p>
          <p className="mt-2">{t("serviceAvailabilityText2")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("warrantiesTitle")}</h2>
          <p className="mt-2">{t("warrantiesText1")}</p>
          <p className="mt-2">{t("warrantiesText2")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("liabilityTitle")}</h2>
          <p className="mt-2">{t("liabilityText1")}</p>
          <p className="mt-2">{t("liabilityText2")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">{t("privacyTitle")}</h2>
          <p className="mt-2">
            {t.rich("privacyText", {
              privacyLink: (chunks) => (
                <Link href="/privacy-policy/" className="text-accent hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
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
