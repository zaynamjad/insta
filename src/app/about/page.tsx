import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadataWithOverrides } from "@/lib/admin/apply-overrides";
import { PageOverridesRenderer } from "@/components/admin/PageOverridesRenderer";
import { SITE_NAME } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadataWithOverrides({
    title: `About ${SITE_NAME}`,
    description: `Learn what ${SITE_NAME} does, how it works, and the principles behind how we handle public Instagram content.`,
    path: "/about/",
  });
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageOverridesRenderer path="/about/" />
      <Breadcrumbs items={[{ name: "About", path: "/about/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        About {SITE_NAME}
      </h1>

      <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/80">
        <p>
          {SITE_NAME} is a single-purpose tool: enter a public Instagram
          username, and see whether that account currently has active
          Stories, without needing to log into Instagram yourself.
        </p>
        <h2 className="mt-8 text-xl font-bold text-foreground">
          What we do
        </h2>
        <p>
          We look up publicly available Instagram Story data for the
          username you provide and display it in a clean, standalone
          viewer. That&apos;s the whole product — no feed browsing, no
          messaging, no account management.
        </p>
        <h2 className="mt-8 text-xl font-bold text-foreground">
          What we don&apos;t do
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>We never ask for your Instagram password or login credentials.</li>
          <li>We don&apos;t access private accounts or bypass Instagram&apos;s privacy settings.</li>
          <li>We don&apos;t require you to create an account to use the tool.</li>
          <li>We don&apos;t post, message, or take any action on Instagram on your behalf.</li>
        </ul>
        <h2 className="mt-8 text-xl font-bold text-foreground">
          Independence
        </h2>
        <p>
          {SITE_NAME} is an independent tool and is not affiliated with,
          endorsed by, or connected to Instagram or Meta Platforms, Inc.
          &quot;Instagram&quot; is a trademark of Meta Platforms, Inc.
        </p>
        <h2 className="mt-8 text-xl font-bold text-foreground">Questions?</h2>
        <p>
          See our{" "}
          <Link href="/privacy-policy/" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          ,{" "}
          <Link href="/terms/" className="text-accent hover:underline">
            Terms of Service
          </Link>
          , or{" "}
          <Link href="/contact/" className="text-accent hover:underline">
            get in touch
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
