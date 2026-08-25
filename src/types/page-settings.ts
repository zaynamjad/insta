export interface PageSeoSettings {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalMode: "auto" | "custom";
  canonicalUrl: string;

  socialTitle: string;
  socialDescription: string;
  useSeoTitleForSocial: boolean;
  useSeoDescriptionForSocial: boolean;
  socialImageUrl: string;
  useDefaultImageForSocial: boolean;
  twitterSite: string;
  twitterCreator: string;

  robotsIndex: "index" | "noindex";
  robotsFollow: "follow" | "nofollow";
  robotsNoImageIndex: boolean;
  robotsNoArchive: boolean;
  robotsNoSnippet: boolean;
  robotsNoTranslate: boolean;

  /** Raw JSON-LD text, added alongside (not instead of) the page's built-in schema. Empty string = none. */
  schemaJsonLd: string;

  /** Raw HTML injected into <head>. Admin-authored only — never derived from public input. */
  headerScripts: string;
  disableHeaderScripts: boolean;

  /** Internal reference only — never rendered on the public page. */
  notes: string;

  updatedAt: string;
}

export const DEFAULT_PAGE_SEO_SETTINGS: PageSeoSettings = {
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  canonicalMode: "auto",
  canonicalUrl: "",

  socialTitle: "",
  socialDescription: "",
  useSeoTitleForSocial: true,
  useSeoDescriptionForSocial: true,
  socialImageUrl: "",
  useDefaultImageForSocial: true,
  twitterSite: "",
  twitterCreator: "",

  robotsIndex: "index",
  robotsFollow: "follow",
  robotsNoImageIndex: false,
  robotsNoArchive: false,
  robotsNoSnippet: false,
  robotsNoTranslate: false,

  schemaJsonLd: "",

  headerScripts: "",
  disableHeaderScripts: false,

  notes: "",

  updatedAt: "",
};
