import { allLandingPages } from "@/content/landing-pages";
import { blogIndex } from "@/content/blog-index";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export interface PageRegistryEntry {
  path: string;
  label: string;
  defaultTitle: string;
  defaultDescription: string;
}

const STATIC_ENTRIES: PageRegistryEntry[] = [
  {
    path: "/",
    label: "Home",
    defaultTitle: `${SITE_NAME} — Instagram Story Viewer | View Stories Anonymously`,
    defaultDescription: SITE_DESCRIPTION,
  },
  {
    path: "/blog/",
    label: "Guides index",
    defaultTitle: "Instagram Story Guides & Educational Articles",
    defaultDescription:
      "Guides and explainers on how Instagram Stories work — anonymous viewing, login-free access, Story viewer lists, and how Stories compare to Highlights.",
  },
  { path: "/about/", label: "About", defaultTitle: `About ${SITE_NAME}`, defaultDescription: "" },
  { path: "/contact/", label: "Contact", defaultTitle: `Contact ${SITE_NAME}`, defaultDescription: "" },
  { path: "/privacy-policy/", label: "Privacy Policy", defaultTitle: "Privacy Policy", defaultDescription: "" },
  { path: "/terms/", label: "Terms of Service", defaultTitle: "Terms of Service", defaultDescription: "" },
  { path: "/disclaimer/", label: "Disclaimer", defaultTitle: "Disclaimer", defaultDescription: "" },
];

const LANDING_ENTRIES: PageRegistryEntry[] = allLandingPages.map((page) => ({
  path: page.path,
  label: page.h1,
  defaultTitle: page.title,
  defaultDescription: page.description,
}));

const BLOG_ENTRIES: PageRegistryEntry[] = blogIndex.map((post) => ({
  path: `/blog/${post.slug}/`,
  label: post.title,
  defaultTitle: post.title,
  defaultDescription: post.description,
}));

export const PAGE_REGISTRY: PageRegistryEntry[] = [
  ...STATIC_ENTRIES,
  ...LANDING_ENTRIES,
  ...BLOG_ENTRIES,
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
