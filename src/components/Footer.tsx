import Link from "next/link";
import { SITE_NAME, SITE_SHORT_DESCRIPTION, FOOTER_COMPANY_LINKS } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div>
            <span className="text-lg font-bold tracking-tight">{SITE_NAME}</span>
            <p className="mt-2 max-w-xs text-sm text-foreground/65">
              {SITE_SHORT_DESCRIPTION}
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:justify-end">
              {FOOTER_COMPANY_LINKS.map((link) => (
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
          </nav>
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
