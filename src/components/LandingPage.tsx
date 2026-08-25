import Link from "next/link";
import { StoryTool } from "@/components/story-tool/StoryTool";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PageOverridesRenderer } from "@/components/admin/PageOverridesRenderer";
import type { FaqItem, BreadcrumbItem } from "@/lib/seo/schema";
import { softwareApplicationSchema } from "@/lib/seo/schema";

export interface LandingPageProps {
  eyebrow: string;
  h1: string;
  intro: string;
  breadcrumb: BreadcrumbItem;
  aboutHeading: string;
  aboutParagraphs: string[];
  howItWorks: { step: string; text: string }[];
  benefits: string[];
  faqs: FaqItem[];
  relatedSearches: { label: string; href: string }[];
}

export function LandingPage({
  eyebrow,
  h1,
  intro,
  breadcrumb,
  aboutHeading,
  aboutParagraphs,
  howItWorks,
  benefits,
  faqs,
  relatedSearches,
}: LandingPageProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd data={softwareApplicationSchema()} />
      <PageOverridesRenderer path={breadcrumb.path} />
      <Breadcrumbs items={[breadcrumb]} />

      <div className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {h1}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-foreground/70">{intro}</p>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-6">
        <StoryTool variant="compact" />
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {aboutHeading}
        </h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/75">
          {aboutParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          How It Works
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {howItWorks.map((item, i) => (
            <li
              key={item.step}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <span className="brand-gradient flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="mt-3 font-semibold text-foreground">{item.step}</p>
              <p className="mt-1 text-sm text-foreground/65">{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Why Use This Tool?
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-2.5 rounded-xl border border-border bg-surface p-4 text-sm text-foreground/75"
            >
              <svg
                aria-hidden
                className="mt-0.5 shrink-0 text-accent"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <Faq items={faqs} />
      </section>

      <section className="mt-16">
        <h2 className="text-lg font-semibold text-foreground/80">
          Related Searches
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {relatedSearches.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground/70 transition-colors hover:border-accent hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
