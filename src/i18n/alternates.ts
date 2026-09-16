import { SITE_URL } from "@/lib/site";
import { getPathname } from "./navigation";
import { routing } from "./routing";
import { getLocaleMeta } from "./locales";

/**
 * Builds the `alternates.languages` map for a page's metadata: every
 * locale's URL for this same page, plus `x-default` pointing at the
 * (unprefixed) English version. `pathname` is the canonical, unprefixed
 * path, e.g. "/about" — the same shape `next-intl`'s `Link`/`getPathname`
 * expect as `href`.
 *
 * Keys are BCP 47 `hreflangCode` values so that validators and search
 * engines accept every entry.
 */
function withTrailingSlash(path: string): string {
  return path === "/" || path.endsWith("/") ? path : `${path}/`;
}

export function buildLanguageAlternates(pathname: string): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    const meta = getLocaleMeta(locale);
    const hreflang = meta.hreflangCode ?? meta.code;
    const localizedPath = withTrailingSlash(getPathname({ href: pathname, locale }));
    languages[hreflang] = `${SITE_URL}${localizedPath}`;
  }

  languages["x-default"] = `${SITE_URL}${withTrailingSlash(pathname)}`;

  return languages;
}

