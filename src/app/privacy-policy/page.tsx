import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadataWithOverrides } from "@/lib/admin/apply-overrides";
import { PageOverridesRenderer } from "@/components/admin/PageOverridesRenderer";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadataWithOverrides({
    title: "Privacy Policy",
    description: `How ${SITE_NAME} handles data when you search for and view public Instagram Stories.`,
    path: "/privacy-policy/",
  });
}

const LAST_UPDATED = "August 25, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageOverridesRenderer path="/privacy-policy/" />
      <Breadcrumbs items={[{ name: "Privacy Policy", path: "/privacy-policy/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-foreground/50">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-xl font-bold text-foreground">Overview</h2>
          <p className="mt-2">
            {SITE_NAME} (&quot;we&quot;, &quot;us&quot;) provides a tool to
            view publicly available Instagram Stories by username. This
            policy explains what we collect, why, and how it&apos;s handled.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">
            Information we collect
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>Usernames you search.</strong> The Instagram username
              you enter is sent to our server to look up public Story data.
              We do not require or collect your own Instagram credentials —
              never enter your Instagram password on this site.
            </li>
            <li>
              <strong>Technical data.</strong> Standard request metadata
              (such as IP address and user agent) is processed transiently
              for rate limiting, abuse prevention, and basic error logging.
            </li>
            <li>
              <strong>Analytics.</strong> We may use privacy-conscious,
              aggregated analytics (e.g. page views, device type, and
              anonymized event counts such as &quot;search succeeded&quot;
              or &quot;no stories found&quot;) to understand tool usage. We
              do not sell personal data.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">
            What we don&apos;t do
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>We never ask for your Instagram password or login credentials.</li>
            <li>We don&apos;t require account creation to use the tool.</li>
            <li>We don&apos;t sell personal data to third parties.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">Cookies</h2>
          <p className="mt-2">
            We use only the minimum cookies or local storage needed for the
            site to function and, where enabled, privacy-conscious analytics.
            We don&apos;t use cookies to build advertising profiles of
            individual users.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">
            Third-party data provider
          </h2>
          <p className="mt-2">
            To retrieve public Story data, requests may be routed to a
            third-party data provider. We only transmit the username you
            search — no personal account information about you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">Advertising</h2>
          <p className="mt-2">
            This site may display third-party advertising, including through
            Google AdSense. Ad providers may use cookies or similar
            technologies to serve relevant ads; you can manage ad
            personalization through{" "}
            <a
              href="https://adssettings.google.com/"
              className="text-accent hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Google Ads Settings
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">Your rights</h2>
          <p className="mt-2">
            You can contact us at any time to ask what data we hold about
            you or to request deletion of any data we can associate with
            you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">Contact</h2>
          <p className="mt-2">
            Questions about this policy?{" "}
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
