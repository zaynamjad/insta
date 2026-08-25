import Link from "next/link";
import {
  SITE_NAME,
  SITE_SHORT_DESCRIPTION,
  FOOTER_TOOL_LINKS,
  FOOTER_GUIDE_LINKS,
  FOOTER_COMPANY_LINKS,
} from "@/lib/site";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-foreground/65 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <span className="text-lg font-bold tracking-tight">{SITE_NAME}</span>
            <p className="mt-3 max-w-xs text-sm text-foreground/65">
              {SITE_SHORT_DESCRIPTION}
            </p>
          </div>
          <FooterColumn title="Tools" links={FOOTER_TOOL_LINKS} />
          <FooterColumn title="Guides" links={FOOTER_GUIDE_LINKS} />
          <FooterColumn title="Company" links={FOOTER_COMPANY_LINKS} />
        </div>

        <div className="mt-10 space-y-3 border-t border-border pt-6 text-xs leading-relaxed text-foreground/55">
          <p>
            {SITE_NAME} works only with publicly available Instagram content.
            We are not affiliated with, endorsed by, or connected to
            Instagram or Meta Platforms, Inc. &quot;Instagram&quot; is a
            trademark of Meta Platforms, Inc.
          </p>
          <p>
            Never enter your Instagram password on this site. {SITE_NAME}{" "}
            never asks for your Instagram login and cannot access private
            accounts.
          </p>
        </div>

        <p className="mt-6 text-xs text-foreground/45">
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
