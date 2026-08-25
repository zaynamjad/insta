import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadataWithOverrides } from "@/lib/admin/apply-overrides";
import { PageOverridesRenderer } from "@/components/admin/PageOverridesRenderer";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadataWithOverrides({
    title: `Contact ${SITE_NAME}`,
    description: `Get in touch with the ${SITE_NAME} team with questions, feedback, or content removal requests.`,
    path: "/contact/",
  });
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <PageOverridesRenderer path="/contact/" />
      <Breadcrumbs items={[{ name: "Contact", path: "/contact/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Contact Us
      </h1>
      <p className="mt-4 text-base leading-relaxed text-foreground/75">
        Questions, feedback, or a request related to publicly displayed
        content — reach out and we&apos;ll get back to you.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm font-semibold text-foreground/60">Email</p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-1 block text-lg font-semibold text-accent hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
      </div>

      <p className="mt-8 text-sm text-foreground/55">
        For privacy-related requests, see our{" "}
        <Link href="/privacy-policy/" className="text-accent hover:underline">
          Privacy Policy
        </Link>{" "}
        for how to reach us about your data.
      </p>
    </div>
  );
}
