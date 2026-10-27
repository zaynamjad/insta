import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { getLocale } from "next-intl/server";
import "./globals.css";
import { getLocaleMeta } from "@/i18n/locales";
import {
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  TWITTER_HANDLE,
} from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: Instagram Story Viewer | View Stories Anonymously`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
  },
  icons: {
    icon: "/favicon.png",
  },
  verification: {
    google: "ULm6yrKYNbMbqP3xl1PLHekKaqnBcKYE6Rpo8YOgt-0",
    other: {
      "ahrefs-site-verification":
        "0c34c4b43b20dfe296f5cc3c4bbbd6ca902237cf9c7b989298db1c0ec3b86089",
    },
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a10" },
  ],
};

/**
 * True root layout — the one place `<html>`/`<body>` can live. Every page
 * on the site today is under `[locale]`, which is where the public site's
 * chrome (Header, Footer, analytics/ads scripts, the `NextIntlClientProvider`)
 * actually lives — see that layout. This root layout only holds what every
 * route, `[locale]`-prefixed or not (e.g. `/admin/*`), should get: the
 * `<html lang dir>` shell (still resolved via `getLocale()`, which falls
 * back to the default locale outside `[locale]`, so this never throws for
 * a route the i18n middleware doesn't touch) and the dark/light theme
 * script, so design tokens like `bg-surface` work consistently everywhere.
 *
 * The AdSense tag below also has to live here rather than in `[locale]`'s
 * layout: Google's site-verification crawler fetches raw HTML and needs a
 * genuinely static <script> tag inside <head> (next/script, even with
 * strategy="beforeInteractive", only inserts into <head> client-side after
 * hydration — confirmed by diffing the server-rendered HTML, see the git
 * history for this file), and <head> can only be rendered from the layout
 * that owns <html>, i.e. this one. It ends up loading on /admin too as a
 * result; harmless since there are no ad slots there to fill.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const localeMeta = getLocaleMeta(locale);
  const htmlLang = localeMeta.hreflangCode ?? localeMeta.code;

  return (
    <html
      lang={htmlLang}
      dir={localeMeta.dir}
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {`try {
            var t = localStorage.getItem('theme');
            if (t === 'light' || t === 'dark') {
              document.documentElement.setAttribute('data-theme', t);
            }
          } catch (e) {}`}
        </Script>
        {children}
      </body>
    </html>
  );
}
