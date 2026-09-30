import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { websiteSchema, organizationSchema } from "@/lib/seo/schema";
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
        {/* Next emits this as a bootstrap entry (not a literal <script> in the raw HTML head); at runtime it is inserted into <head>. */}
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="PksriBtd52QeXCL7W9mNvw"
          strategy="beforeInteractive"
        />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-W5NQ4KV7QY" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-W5NQ4KV7QY');
          `}
        </Script>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4197958885583712"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <NextIntlClientProvider>
          <JsonLd data={[websiteSchema(), organizationSchema()]} />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
