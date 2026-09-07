import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { buildLanguageAlternates } from "@/i18n/alternates";

interface RouteConfig {
  pathname: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}

const ROUTES: RouteConfig[] = [
  { pathname: "/", changeFrequency: "daily", priority: 1 },
  { pathname: "/about", changeFrequency: "monthly", priority: 0.3 },
  { pathname: "/contact", changeFrequency: "monthly", priority: 0.3 },
  { pathname: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
  { pathname: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { pathname: "/disclaimer", changeFrequency: "yearly", priority: 0.2 },
];

function withTrailingSlash(path: string): string {
  return path === "/" || path.endsWith("/") ? path : `${path}/`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const route of ROUTES) {
    const languages = buildLanguageAlternates(route.pathname);

    for (const locale of routing.locales) {
      const localizedPath = withTrailingSlash(
        getPathname({ href: route.pathname, locale }),
      );

      entries.push({
        url: `${SITE_URL}${localizedPath}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages },
      });
    }
  }

  return entries;
}
