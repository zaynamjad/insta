import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export interface PageRegistryEntry {
  path: string;
  label: string;
  defaultTitle: string;
  defaultDescription: string;
}

export const PAGE_REGISTRY: PageRegistryEntry[] = [
  {
    path: "/",
    label: "Home",
    defaultTitle: `${SITE_NAME}: Instagram Story Viewer | View Stories Anonymously`,
    defaultDescription: SITE_DESCRIPTION,
  },
  { path: "/about/", label: "About", defaultTitle: `About ${SITE_NAME}`, defaultDescription: "" },
  { path: "/contact/", label: "Contact", defaultTitle: `Contact ${SITE_NAME}`, defaultDescription: "" },
  { path: "/privacy-policy/", label: "Privacy Policy", defaultTitle: "Privacy Policy", defaultDescription: "" },
  { path: "/terms/", label: "Terms of Service", defaultTitle: "Terms of Service", defaultDescription: "" },
  { path: "/disclaimer/", label: "Disclaimer", defaultTitle: "Disclaimer", defaultDescription: "" },
];

const REGISTRY_BY_PATH = new Map(PAGE_REGISTRY.map((entry) => [entry.path, entry]));

/**
 * `/profile/[username]/` pages are deliberately excluded — they're a live
 * lookup of third-party data, not authored content, so they don't fit the
 * "edit this page's SEO fields" model the rest of the registry supports.
 */
export function getRegistryEntry(path: string): PageRegistryEntry | null {
  return REGISTRY_BY_PATH.get(path) ?? null;
}

/** Normalizes a `path` route-param array (from `[[...path]]`) into a site path like "/about/". */
export function segmentsToPath(segments: string[] | undefined): string {
  if (!segments || segments.length === 0) return "/";
  return `/${segments.join("/")}/`;
}
