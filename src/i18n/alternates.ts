import { SITE_URL } from "@/lib/site";
import { getPathname } from "./navigation";
import { routing } from "./routing";

/**
 * Builds the `alternates.languages` map for a page's metadata: every
 * locale's URL for this same page, plus `x-default` pointing at the
 * (unprefixed) English version. `pathname` is the canonical, unprefixed
 * path, e.g. "/about" — the same shape `next-intl`'s `Link`/`getPathname`
 * expect as `href`.
 */
function withTrailingSlash(path: string): string {
  return path === "/" || path.endsWith("/") ? path : `${path}/`;
}

export function buildLanguageAlternates(pathname: string): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    const localizedPath = withTrailingSlash(getPathname({ href: pathname, locale }));
    languages[locale] = `${SITE_URL}${localizedPath}`;
  }

  languages["x-default"] = `${SITE_URL}${withTrailingSlash(pathname)}`;

  return languages;
}
