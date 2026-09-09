export const SITE_NAME = "InstaViewStories";
export const SITE_TAGLINE = "Simple, Fast and Free Instagram Story Viewer";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.instaviewstories.com"
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "View publicly available Instagram Stories anonymously. Enter a public Instagram username: no login, no password, no account required.";

export const SITE_SHORT_DESCRIPTION =
  "Anonymous Instagram Story viewer. No login required.";

export const TWITTER_HANDLE = "@instaviewstories";

export const CONTACT_EMAIL = "info@instaviewstories.com";

export const NAV_LINKS = [
  { href: "/#how-it-works", key: "howItWorks" },
  { href: "/#about", key: "about" },
  { href: "/#faq", key: "faq" },
  { href: "/#contact", key: "contact" },
] as const;

export const FOOTER_COMPANY_LINKS = [
  { href: "/about/", key: "linkAbout" },
  { href: "/contact/", key: "linkContact" },
  { href: "/privacy-policy/", key: "linkPrivacy" },
  { href: "/terms/", key: "linkTerms" },
  { href: "/disclaimer/", key: "linkDisclaimer" },
] as const;
