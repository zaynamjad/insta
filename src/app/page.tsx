import type { Metadata } from "next";
import Image from "next/image";
import { StoryTool } from "@/components/story-tool/StoryTool";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { softwareApplicationSchema } from "@/lib/seo/schema";
import { buildMetadataWithOverrides } from "@/lib/admin/apply-overrides";
import { PageOverridesRenderer } from "@/components/admin/PageOverridesRenderer";
import { SITE_NAME } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadataWithOverrides({
    title: `${SITE_NAME} — Instagram Story Viewer | View Stories Anonymously`,
    description:
      "Enter a public Instagram username to view publicly available Stories without logging into Instagram. No password, no account, no app install.",
    path: "/",
  });
}

const homeFaqs = [
  {
    question: "What is an Instagram Story Viewer?",
    answer:
      "It's a tool that looks up a public Instagram account's profile information — photo, name, bio, follower counts — by fetching the same public profile page anyone's browser would see, without you needing to log in.",
  },
  {
    question: "Can I view public Instagram Stories without logging in?",
    answer:
      "No — and neither can this tool. Instagram only serves Story media through a logged-in session, even for public accounts; it's never exposed on the public, unauthenticated profile page. This tool doesn't attempt to bypass that, so it never returns Story content — only public profile information.",
  },
  {
    question: "Why can't some Stories be retrieved?",
    answer:
      "Stories aren't sometimes unavailable — they're never retrievable through public, unauthenticated access, on any account. Unlike a profile's basic info, Instagram doesn't expose Story media outside of a logged-in session. This isn't a bug or a temporary limitation; it's how Instagram's access control works.",
  },
  {
    question: "Does this tool work with private accounts?",
    answer:
      "No. It only works with public profiles. Private accounts require the owner's approval inside Instagram itself, and this tool never attempts to bypass that.",
  },
  {
    question: "How does this tool retrieve profile information?",
    answer:
      "By fetching a public account's Instagram profile page the same way any anonymous, logged-out visitor's browser would, then reading the public information Instagram includes in that page — no login, no private API, no bypass of any access control.",
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={softwareApplicationSchema()} />
      <PageOverridesRenderer path="/" />

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full opacity-20 blur-3xl brand-gradient"
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-12 sm:pt-16 sm:pb-16 lg:flex lg:items-center lg:gap-12 lg:pt-20">
          <Image
            src="/mascot.png"
            alt=""
            width={1086}
            height={1448}
            priority
            className="order-first mx-auto w-36 sm:w-44 lg:order-last lg:mx-0 lg:w-[380px] lg:shrink-0"
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 176px, 144px"
          />

          <div className="mt-4 text-center lg:mt-0 lg:flex-1 lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground/60">
              Public profiles only · No login required
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Instagram Story Viewer
            </h1>
            <p className="mt-5 text-lg text-foreground/70 sm:text-xl">
              Enter a public Instagram username to see their public profile
              info instantly — no login required.
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-foreground/50 lg:mx-0">
              Story media itself can&apos;t be retrieved without an Instagram
              login, on any account — see why in the FAQ below.
            </p>

            <div className="mx-auto mt-8 max-w-xl text-left lg:mx-0">
              <StoryTool variant="hero" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          How It Works
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { title: "Enter a username", text: "Type any public Instagram handle into the search box." },
            { title: "Search public Stories", text: "We check whether that account currently has active public Stories." },
            { title: "View available Stories", text: "Browse them instantly in a clean, full-screen viewer." },
          ].map((item, i) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-surface p-6 text-center"
            >
              <span className="brand-gradient mx-auto flex h-10 w-10 items-center justify-center rounded-full text-base font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-foreground/65">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-muted py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Why Use Our Instagram Story Viewer?
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[
              "No Instagram login required",
              "Simple username search",
              "Fast story lookup",
              "Mobile-friendly viewer",
              "Public profiles only",
              "No account registration",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
              >
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
                <span className="text-sm font-medium text-foreground/80">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <Faq items={homeFaqs} />
      </section>
    </>
  );
}
