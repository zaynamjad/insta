export const SITE_NAME = "InstaViewStories";
export const SITE_TAGLINE = "Instagram Story Viewer";
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
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#about", label: "About" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#contact", label: "Contact" },
];

export const FOOTER_COMPANY_LINKS = [
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
  { href: "/privacy-policy/", label: "Privacy Policy" },
  { href: "/terms/", label: "Terms of Service" },
  { href: "/disclaimer/", label: "Disclaimer" },
];
