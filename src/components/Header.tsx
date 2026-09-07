import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS, SITE_NAME } from "@/lib/site";
import { MobileNav } from "@/components/MobileNav";

export function Header() {
  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center">
          <Image
            src="/logo.png"
            alt={SITE_NAME}
            width={500}
            height={250}
            priority
            className="h-16 w-auto sm:h-20"
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="brand-gradient hidden shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 md:inline-block"
          >
            View Stories
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
