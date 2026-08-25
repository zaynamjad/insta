import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadataWithOverrides } from "@/lib/admin/apply-overrides";
import { PageOverridesRenderer } from "@/components/admin/PageOverridesRenderer";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadataWithOverrides({
    title: "Terms of Service",
    description: `The terms that govern your use of ${SITE_NAME}.`,
    path: "/terms/",
  });
}

const LAST_UPDATED = "August 25, 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageOverridesRenderer path="/terms/" />
      <Breadcrumbs items={[{ name: "Terms of Service", path: "/terms/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-3 text-sm text-foreground/50">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-xl font-bold text-foreground">Acceptance</h2>
          <p className="mt-2">
            By using {SITE_NAME}, you agree to these terms. If you don&apos;t
            agree, please don&apos;t use the site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">
            Permitted use
          </h2>
          <p className="mt-2">
            {SITE_NAME} is provided for viewing publicly available Instagram
            Story content only. You agree not to use this tool to:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Attempt to access private accounts or bypass Instagram&apos;s privacy or security controls.</li>
            <li>Harass, stalk, or monitor another person without their consent.</li>
            <li>Scrape, automate, or abuse the service at a volume that degrades it for other users.</li>
            <li>Use the service for any unlawful purpose.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">
            No Instagram affiliation
          </h2>
          <p className="mt-2">
            {SITE_NAME} is an independent tool and is not affiliated with,
            endorsed by, sponsored by, or connected to Instagram or Meta
            Platforms, Inc. &quot;Instagram&quot; is a trademark of Meta
            Platforms, Inc.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">
            Availability and accuracy
          </h2>
          <p className="mt-2">
            We rely on third-party data sources to retrieve public Story
            content, and availability or accuracy can&apos;t be guaranteed at
            all times. The service is provided &quot;as is&quot; without
            warranties of any kind.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">
            Limitation of liability
          </h2>
          <p className="mt-2">
            To the fullest extent permitted by law, {SITE_NAME} and its
            operators are not liable for any indirect, incidental, or
            consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">
            Changes to these terms
          </h2>
          <p className="mt-2">
            We may update these terms from time to time. Continued use of
            the site after changes means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">Contact</h2>
          <p className="mt-2">
            Questions about these terms?{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
              {CONTACT_EMAIL}
            </a>{" "}
            or visit our{" "}
            <Link href="/contact/" className="text-accent hover:underline">
              Contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
