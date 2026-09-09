import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { StoryTool } from "@/components/story-tool/StoryTool";
import { FeaturedCarousel } from "@/components/story-tool/FeaturedCarousel";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { softwareApplicationSchema } from "@/lib/seo/schema";
import { buildMetadataWithOverrides } from "@/lib/admin/apply-overrides";
import { PageOverridesRenderer } from "@/components/admin/PageOverridesRenderer";
import { getPathname } from "@/i18n/navigation";
import { buildLanguageAlternates } from "@/i18n/alternates";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";

type Props = PageProps<"/[locale]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HomePage" });
  return buildMetadataWithOverrides({
    title: t("metaTitle", { siteName: SITE_NAME }),
    description: t("metaDescription"),
    path: "/",
    localizedPath: getPathname({ href: "/", locale }),
    languageAlternates: buildLanguageAlternates("/"),
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HomePage" });

  const homeFaqs = Array.from({ length: 12 }, (_, i) => i + 1).map((n) => ({
    question: t(`faq${n}Q` as "faq1Q"),
    answer: t(`faq${n}A` as "faq1A"),
  }));

  const howItWorksSteps = [1, 2, 3].map((n) => ({
    title: t(`step${n}Title` as "step1Title"),
    text: t(`step${n}Text` as "step1Text"),
  }));

  const featureCards = [1, 2, 3, 4, 5, 9].map((n) => ({
    title: t(`featureCard${n}Title` as "featureCard1Title"),
    text: t(`featureCard${n}Text` as "featureCard1Text"),
  }));
  const whyItems = [1, 2, 4, 8].map((n) => ({
    title: t(`whyItem${n}Title` as "whyItem1Title"),
    text: t(`whyItem${n}Text` as "whyItem1Text"),
  }));

  const featureIcons = [
    // Story Viewer
    <svg key="1" aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>,
    // Profile Viewer
    <svg key="2" aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    // Posts Browser
    <svg key="3" aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
    // Highlights Viewer
    <svg key="4" aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    // Story Downloader
    <svg key="5" aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
    // Reels Downloader
    <svg key="6" aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"/><line x1="7" x2="7" y1="2" y2="22"/><line x1="17" x2="17" y1="2" y2="22"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="2" x2="7" y1="7" y2="7"/><line x1="2" x2="7" y1="17" y2="17"/><line x1="17" x2="22" y1="17" y2="17"/><line x1="17" x2="22" y1="7" y2="7"/></svg>
  ];

  return (
    <>
      <JsonLd data={softwareApplicationSchema()} />
      <PageOverridesRenderer path="/" />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section id="search" className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full opacity-20 blur-3xl brand-gradient"
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-2 pb-12 sm:pt-6 sm:pb-16 lg:flex lg:items-center lg:gap-12 lg:pt-8">
          <Image
            src="/mascot.png"
            alt=""
            width={1086}
            height={1448}
            priority
            className="order-first mx-auto hidden sm:block sm:w-44 lg:order-last lg:mx-0 lg:w-[380px] lg:shrink-0"
            sizes="(min-width: 1024px) 380px, 176px"
          />

          <div className="mt-4 text-center lg:mt-0 lg:flex-1 lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              {t("heroEyebrow")}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground/60">
                <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M20 6 9 17l-5-5" /></svg>
                {t("badgeFree")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground/60">
                <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M20 6 9 17l-5-5" /></svg>
                {t("badgeNoRegistration")}
              </span>
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl">
              {t("h1")}
            </h1>
            <p className="mt-5 text-lg text-foreground/70 sm:text-xl">
              {t("sub1")}
            </p>

            <div className="mx-auto mt-8 max-w-xl text-left lg:mx-0">
              <StoryTool variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending Carousel ─────────────────────────────────── */}
      <section className="border-b border-border bg-surface-muted py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-sm font-medium text-foreground/50">
            {t("trendingCaption")}
          </p>
        </div>
        <div className="mt-6">
          <FeaturedCarousel />
        </div>
      </section>

      {/* ── Features (6 cards, no duplicates with Why section) ── */}
      <section className="bg-surface-muted py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("featuresTitle")}
            </h2>
            <p className="mt-3 text-foreground/65">{t("featuresIntro")}</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((item, i) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:shadow-md hover:border-accent/30"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors duration-200 group-hover:bg-accent/20">
                  {featureIcons[i]}
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-foreground/50">
            {t("featuresClosing")}
          </p>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("howItWorksTitle")}
          </h2>
          <p className="mt-3 text-foreground/65">{t("howItWorksIntro")}</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {howItWorksSteps.map((item, i) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-surface p-6 text-center transition-all duration-200 hover:shadow-md hover:border-accent/30"
            >
              <span className="brand-gradient mx-auto flex h-10 w-10 items-center justify-center rounded-full text-base font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/65">{item.text}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-foreground/60">
          {t("howItWorksCta")}
        </p>
      </section>

      {/* ── Why Choose Us ─────────────────────────────────────── */}
      <section className="bg-surface-muted py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="lg:flex lg:items-center lg:gap-10">
            <Image
              src="/mascot-phone.png"
              alt=""
              width={2000}
              height={2000}
              className="mx-auto w-36 sm:w-44 lg:mx-0 lg:w-56 lg:shrink-0"
              sizes="(min-width: 1024px) 224px, 176px"
            />
            <div className="mt-6 text-center lg:mt-0 lg:flex-1 lg:text-left">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t("whyTitle")}
              </h2>
              <p className="mt-3 text-foreground/65">{t("whyText")}</p>
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {whyItems.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:shadow-md hover:border-accent/30"
              >
                <div className="flex items-center gap-2.5">
                  <svg
                    aria-hidden
                    className="shrink-0 text-accent"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span className="text-sm font-semibold text-foreground/80">
                    {item.title}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/60">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-foreground/50">
            {t("whyNote")}
          </p>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────── */}
      <section id="contact" className="py-16">
        <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("contactTitle")}
          </h2>
          <p className="mt-4 leading-relaxed text-foreground/70">
            {t("contactText")}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="brand-gradient mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m2 7 10 6 10-6" />
            </svg>
            {CONTACT_EMAIL}
          </a>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="bg-surface-muted py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Faq items={homeFaqs} title={t("faqTitle")} />
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="flex flex-col-reverse items-center gap-6 rounded-3xl border border-border bg-surface p-8 sm:flex-row sm:justify-center sm:gap-10">
          <div className="text-center sm:text-right">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              {t("finalCtaTitle")}
            </h2>
            <p className="mt-2 text-sm text-foreground/65">
              {t("finalCtaText1")}
            </p>
            <p className="mt-1 text-sm text-foreground/65">
              {t("finalCtaText2")}
            </p>
            <Link
              href="/#search"
              className="brand-gradient mt-4 inline-block cursor-pointer rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              {t("finalCtaButton")}
            </Link>
            <p className="mt-3 text-xs text-foreground/45">
              {t("finalCtaSupportingText")}
            </p>
          </div>
          <Image
            src="/mascot-pointing.png"
            alt=""
            width={1156}
            height={1367}
            className="w-40 shrink-0 sm:w-48"
            sizes="192px"
          />
        </div>
      </section>
    </>
  );
}
