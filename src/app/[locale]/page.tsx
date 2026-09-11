import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { StoryTool } from "@/components/story-tool/StoryTool";
import { FeaturedCarousel } from "@/components/story-tool/FeaturedCarousel";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { softwareApplicationSchema } from "@/lib/seo/schema";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPathname } from "@/i18n/navigation";
import { buildLanguageAlternates } from "@/i18n/alternates";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";

type Props = PageProps<"/[locale]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HomePage" });
  return buildMetadata({
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
  const whyItems = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
    number: n,
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

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section id="search" className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-[320px] w-[600px] -translate-x-1/2 rounded-full opacity-15 blur-3xl brand-gradient -z-10 sm:-top-40 sm:h-[480px] sm:w-[900px] sm:opacity-20"
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-14 lg:flex lg:items-center lg:gap-12 lg:py-16">
          <Image
            src="/mascot.png"
            alt=""
            width={1086}
            height={1448}
            priority
            className="order-first mx-auto hidden sm:block sm:w-40 lg:order-last lg:mx-0 lg:w-[340px] lg:shrink-0 xl:w-[380px]"
            sizes="(min-width: 1024px) 340px, 160px"
          />

          <div className="mt-4 w-full text-center lg:mt-0 lg:flex-1 lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              {t("heroEyebrow")}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground/60">
                <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-accent"><path d="M20 6 9 17l-5-5" /></svg>
                {t("badgeFree")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground/60">
                <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-accent"><path d="M20 6 9 17l-5-5" /></svg>
                {t("badgeNoRegistration")}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:mt-5 sm:text-4xl md:text-5xl lg:text-6xl">
              {t("h1")}
            </h1>
            <p className="mt-4 text-base text-foreground/70 sm:mt-5 sm:text-lg md:text-xl">
              {t("sub1")}
            </p>

            <div className="mx-auto mt-6 w-full max-w-xl text-left sm:mt-8 lg:mx-0">
              <StoryTool variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending Carousel ─────────────────────────────────── */}
      <section className="border-b border-border bg-surface-muted py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-xs font-medium text-foreground/50 sm:text-sm">
            {t("trendingCaption")}
          </p>
        </div>
        <div className="mt-4 w-full overflow-hidden sm:mt-6">
          <FeaturedCarousel />
        </div>
      </section>

      {/* ── Features (6 cards, no duplicates with Why section) ── */}
      <section className="bg-surface-muted py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
              {t("featuresTitle")}
            </h2>
            <p className="mt-3 text-sm text-foreground/65 sm:text-base">{t("featuresIntro")}</p>
          </div>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {featureCards.map((item, i) => (
              <div
                key={item.title}
                className="group flex flex-col justify-start rounded-2xl border border-border/80 bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 sm:p-6"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors duration-200 group-hover:bg-accent group-hover:text-white sm:h-10 sm:w-10">
                  {featureIcons[i]}
                </div>
                <h3 className="text-sm font-bold text-foreground transition-colors duration-200 group-hover:text-accent sm:text-base">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-foreground/65 sm:text-sm">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-foreground/50 sm:mt-8">
            {t("featuresClosing")}
          </p>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section id="how-it-works" className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-1/2 h-[260px] w-[520px] -translate-x-1/2 rounded-full opacity-10 blur-3xl brand-gradient -z-10 sm:-top-16 sm:h-[360px] sm:w-[760px] sm:opacity-15"
        />
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
            {t("howItWorksTitle")}
          </h2>
          <p className="mt-3 text-sm text-foreground/65 sm:text-base">{t("howItWorksIntro")}</p>
        </div>
        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-3 sm:gap-6">
          {howItWorksSteps.map((item, i) => (
            <div
              key={item.title}
              className="group flex flex-col items-center rounded-2xl border border-border/80 bg-surface p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 sm:p-6"
            >
              <span className="brand-gradient flex h-10 w-10 items-center justify-center rounded-full text-base font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-110">
                {i + 1}
              </span>
              <h3 className="mt-3 text-sm font-bold text-foreground transition-colors duration-200 group-hover:text-accent sm:mt-4 sm:text-base">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-foreground/65 sm:text-sm">{item.text}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-foreground/60 sm:mt-8 sm:text-sm">
          {t("howItWorksCta")}
        </p>
      </section>

      {/* ── Why Choose Us ─────────────────────────────────────── */}
      <section className="bg-surface-muted py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 text-center sm:gap-6 lg:flex-row lg:items-center lg:gap-10 lg:text-left">
            <Image
              src="/mascot-phone.png"
              alt=""
              width={2000}
              height={2000}
              className="w-28 shrink-0 sm:w-36 lg:w-52"
              sizes="(min-width: 1024px) 208px, 144px"
            />
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
                {t("whyTitle")}
              </h2>
              <p className="mt-3 text-sm text-foreground/65 sm:text-base">{t("whyText")}</p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {whyItems.map((item) => (
              <div
                key={item.title}
                className="group flex flex-col justify-start rounded-2xl border border-border/80 bg-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 sm:p-5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-extrabold text-accent transition-colors duration-200 group-hover:bg-accent group-hover:text-white">
                  {item.number}
                </div>
                <h3 className="mt-3 text-sm font-bold text-foreground transition-colors duration-200 group-hover:text-accent sm:text-base">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-foreground/65 sm:text-sm">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center sm:mt-8">
            <div className="inline-flex max-w-full items-start gap-2 rounded-2xl border border-border/80 bg-surface px-4 py-3 text-xs font-medium text-foreground/70 shadow-sm sm:items-center sm:rounded-full">
              <svg aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent sm:mt-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="leading-snug">{t("whyNote")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────── */}
      <section id="contact" className="relative py-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-1/2 h-[220px] w-[440px] -translate-x-1/2 rounded-full opacity-10 blur-3xl brand-gradient -z-10 sm:-top-14 sm:h-[300px] sm:w-[620px] sm:opacity-15"
        />
        <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
            {t("contactTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70 sm:mt-4 sm:text-base">
            {t("contactText")}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="brand-gradient mt-5 inline-flex max-w-full cursor-pointer items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:mt-6 sm:px-6"
          >
            <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m2 7 10 6 10-6" />
            </svg>
            <span className="min-w-0 truncate">{CONTACT_EMAIL}</span>
          </a>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="bg-surface-muted py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Faq items={homeFaqs} title={t("faqTitle")} />
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 left-1/2 h-[220px] w-[440px] -translate-x-1/2 rounded-full opacity-10 blur-3xl brand-gradient -z-10 sm:-top-12 sm:h-[300px] sm:w-[620px] sm:opacity-15"
        />
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-surface p-6 sm:flex-row sm:gap-8 sm:p-8">
          <Image
            src="/mascot-pointing.png"
            alt=""
            width={1156}
            height={1367}
            className="w-28 shrink-0 scale-x-[-1] sm:w-40 md:w-48"
            sizes="(min-width: 640px) 192px, 112px"
          />
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold tracking-tight sm:text-xl md:text-2xl">
              {t("finalCtaTitle")}
            </h2>
            <p className="mt-2 text-xs text-foreground/65 sm:text-sm">
              {t("finalCtaText1")}
            </p>
            <p className="mt-1 text-xs text-foreground/65 sm:text-sm">
              {t("finalCtaText2")}
            </p>
            <Link
              href="/#search"
              className="brand-gradient mt-4 inline-block cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:px-6 sm:py-3"
            >
              {t("finalCtaButton")}
            </Link>
            <p className="mt-3 text-xs text-foreground/45">
              {t("finalCtaSupportingText")}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
