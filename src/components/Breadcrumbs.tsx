import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, type BreadcrumbItem } from "@/lib/seo/schema";

export async function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const t = await getTranslations("Breadcrumbs");
  const full: BreadcrumbItem[] = [{ name: t("home"), path: "/" }, ...items];

  return (
    <>
      <JsonLd data={breadcrumbSchema(full)} />
      <nav aria-label="Breadcrumb" className="text-sm text-foreground/55">
        <ol className="flex flex-wrap items-center gap-1.5">
          {full.map((item, index) => (
            <li key={item.path} className="flex items-center gap-1.5">
              {index > 0 && <span aria-hidden>/</span>}
              {index === full.length - 1 ? (
                <span className="text-foreground/75" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="hover:text-foreground">
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
