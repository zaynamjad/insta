export const SITE_NAME = "StoryPeek";
export const SITE_TAGLINE = "Instagram Story Viewer";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.storypeek.com"
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "View publicly available Instagram Stories anonymously. Enter a public Instagram username — no login, no password, no account required.";

export const SITE_SHORT_DESCRIPTION =
  "Anonymous Instagram Story viewer. No login required.";

export const TWITTER_HANDLE = "@storypeek";

export const CONTACT_EMAIL = "hello@storypeek.com";

export const NAV_LINKS = [
  { href: "/instagram-story-viewer/", label: "Story Viewer" },
  { href: "/anonymous-instagram-story-viewer/", label: "Anonymous Viewer" },
  { href: "/blog/", label: "Guides" },
  { href: "/about/", label: "About" },
];

export const FOOTER_TOOL_LINKS = [
  { href: "/instagram-story-viewer/", label: "Instagram Story Viewer" },
  {
    href: "/anonymous-instagram-story-viewer/",
    label: "Anonymous Instagram Story Viewer",
  },
  {
    href: "/instagram-story-viewer-without-login/",
    label: "Instagram Story Viewer Without Login",
  },
  {
    href: "/instagram-story-viewer-by-username/",
    label: "Instagram Story Viewer by Username",
  },
  { href: "/anonymous-instagram-viewer/", label: "Anonymous Instagram Viewer" },
];

export const FOOTER_COMPANY_LINKS = [
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
  { href: "/privacy-policy/", label: "Privacy Policy" },
  { href: "/terms/", label: "Terms of Service" },
  { href: "/disclaimer/", label: "Disclaimer" },
];

export const FOOTER_GUIDE_LINKS = [
  {
    href: "/blog/how-to-view-instagram-stories-anonymously/",
    label: "How to View Instagram Stories Anonymously",
  },
  {
    href: "/blog/instagram-story-viewer-without-login-guide/",
    label: "Instagram Story Viewer Without Login",
  },
  {
    href: "/blog/can-someone-see-if-you-viewed-their-instagram-story/",
    label: "Can Someone See If You Viewed Their Story?",
  },
];
