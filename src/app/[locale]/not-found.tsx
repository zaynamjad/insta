import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFoundPage");

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="brand-gradient-text text-7xl font-extrabold tracking-tight">
        404
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        {t("title")}
      </h1>
      <p className="mt-3 text-foreground/65">{t("text")}</p>
      <Link
        href="/"
        className="brand-gradient mt-6 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
      >
        {t("button")}
      </Link>
    </div>
  );
}
