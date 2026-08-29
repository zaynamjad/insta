import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadataWithOverrides } from "@/lib/admin/apply-overrides";
import { PageOverridesRenderer } from "@/components/admin/PageOverridesRenderer";
import { SITE_NAME } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadataWithOverrides({
    title: "Disclaimer",
    description: `Important information about what ${SITE_NAME} can and cannot do.`,
    path: "/disclaimer/",
  });
}

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageOverridesRenderer path="/disclaimer/" />
      <Breadcrumbs items={[{ name: "Disclaimer", path: "/disclaimer/" }]} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Disclaimer
      </h1>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-xl font-bold text-foreground">
            Public content only
          </h2>
          <p className="mt-2">
            {SITE_NAME} only retrieves and displays content from public
            Instagram profiles. We cannot and do not access private
            accounts, direct messages, or any content behind Instagram&apos;s
            login wall.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">
            No password requests
          </h2>
          <p className="mt-2">
            We will never ask for your Instagram password. Any website that
            requests your Instagram login credentials to &quot;view
            stories&quot; should be treated as untrustworthy. {SITE_NAME}{" "}
            never does this.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">
            Anonymity is limited
          </h2>
          <p className="mt-2">
            &quot;Anonymous&quot; on this site means your personal Instagram
            account is not used to open a Story, so it isn&apos;t added to
            the account owner&apos;s native viewer list. It does not mean
            guaranteed technical anonymity in every sense: we rely on
            third-party infrastructure to retrieve data, and we can&apos;t
            make guarantees about systems outside our control.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">
            No Instagram affiliation
          </h2>
          <p className="mt-2">
            {SITE_NAME} is not affiliated with, endorsed by, or connected to
            Instagram or Meta Platforms, Inc. All trademarks belong to their
            respective owners.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">
            Data availability
          </h2>
          <p className="mt-2">
            Story availability depends on what the account owner has
            currently posted and on our data provider&apos;s ability to
            retrieve it. We cannot guarantee that every public account&apos;s
            Stories will always be retrievable.
          </p>
        </section>
      </div>
    </div>
  );
}
