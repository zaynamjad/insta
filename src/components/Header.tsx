import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SITE_NAME } from "@/lib/site";
import { MobileNav } from "@/components/MobileNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export async function Header() {
  const t = await getTranslations("Header");

  return (
    <header>
      <div className="mx-auto flex h-32 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center">
          <Image
            src="/logo.png"
            alt={SITE_NAME}
            width={500}
            height={250}
            priority
            className="logo-light h-24 w-auto sm:h-28"
          />
          <Image
            src="/logo-dark.png"
            alt={SITE_NAME}
            width={500}
            height={250}
            priority
            className="logo-dark h-24 w-auto sm:h-28"
          />
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href="/"
            className="brand-gradient hidden shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 md:inline-block"
          >
            {t("viewStories")}
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
