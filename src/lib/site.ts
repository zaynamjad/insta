export const SITE_NAME = "InstaViewStories";
export const SITE_TAGLINE = "Simple, Fast and Free Instagram Story Viewer";
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
export const SITE_URL = (
  rawSiteUrl && !rawSiteUrl.includes("vercel.app") && !rawSiteUrl.includes("localhost")
    ? rawSiteUrl
    : "https://instaviewstories.com"
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
  { href: "/about-us/", key: "linkAbout" },
  { href: "/contact-us/", key: "linkContact" },
  { href: "/privacy-policy/", key: "linkPrivacy" },
  { href: "/terms-and-conditions/", key: "linkTerms" },
  { href: "/disclaimer/", key: "linkDisclaimer" },
] as const;

export const SOCIAL_LINKS = [
  { name: "LinkedIn", href: "https://www.linkedin.com/company/instaview-stories/" },
  { name: "Facebook", href: "https://www.facebook.com/people/InstaView-Stories/61594039874600/" },
  { name: "Instagram", href: "https://www.instagram.com/instaviewstories/" },
  { name: "Pinterest", href: "https://www.pinterest.com/instaviewstories/" },
  { name: "X", href: "https://x.com/instaviewstory" },
] as const;
