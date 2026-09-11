import type { Metadata } from "next";
import Image from "next/image";
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

  const aboutBoxes = [
    {
      title: t("whatWeDoTitle"),
      body: <p className="mt-3 text-sm leading-relaxed text-foreground/75">{t("whatWeDoText")}</p>,
    },
    {
      title: t("whatWeDontTitle"),
      body: (
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/75">
          <li>{t("dontItem1")}</li>
          <li>{t("dontItem2")}</li>
          <li>{t("dontItem3")}</li>
          <li>{t("dontItem4")}</li>
        </ul>
      ),
    },
    {
      title: t("independenceTitle"),
      body: (
        <p className="mt-3 text-sm leading-relaxed text-foreground/75">
          {t("independenceText", { siteName: SITE_NAME })}
        </p>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Breadcrumbs items={[{ name: t("breadcrumb"), path: "/about/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("h1", { siteName: SITE_NAME })}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80">
        {t("intro", { siteName: SITE_NAME })}
      </p>

      <div className="mt-10 lg:flex lg:items-start lg:gap-10">
        <Image
          src="/about-pic.jpeg"
          alt=""
          width={1254}
          height={1254}
          className="order-first mx-auto w-64 shrink-0 rounded-3xl sm:w-80 lg:sticky lg:top-8 lg:order-last lg:mx-0 lg:w-[380px]"
          sizes="(min-width: 1024px) 380px, 320px"
        />

        <div className="mt-6 space-y-4 lg:mt-0 lg:flex-1">
          {aboutBoxes.map((box, i) => (
            <div
              key={box.title}
              className="rounded-2xl border border-border/80 bg-surface p-5 sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h2 className="text-lg font-bold text-foreground">{box.title}</h2>
              </div>
              {box.body}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 space-y-5 text-base leading-relaxed text-foreground/80">
        <h2 className="text-xl font-bold text-foreground">{t("questionsTitle")}</h2>
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
