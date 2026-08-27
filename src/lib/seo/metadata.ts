import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export interface RobotsFlags {
  index?: boolean;
  follow?: boolean;
  noimageindex?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  notranslate?: boolean;
}

interface BuildMetadataArgs {
  title: string;
  description: string;
  /** Site-relative path starting with "/", e.g. "/about/" */
  path: string;
  ogImagePath?: string;
  noindex?: boolean;
  keywords?: string[];
  /** Overrides `title`/`description` for the og and twitter tags only, when they should read differently from the page title/meta description. */
  socialTitle?: string;
  socialDescription?: string;
  twitterSite?: string;
  twitterCreator?: string;
  /** Full control over robots directives; takes precedence over `noindex` when provided. */
  robots?: RobotsFlags;
  /** Absolute or site-relative canonical override; defaults to `${SITE_URL}${path}`. */
  canonicalUrl?: string;
}

function resolveUrl(value: string): string {
  return value.startsWith("http") ? value : `${SITE_URL}${value}`;
}

export function buildMetadata({
  title,
  description,
  path,
  ogImagePath,
  noindex,
  keywords,
  socialTitle,
  socialDescription,
  twitterSite,
  twitterCreator,
  robots,
  canonicalUrl,
}: BuildMetadataArgs): Metadata {
  const url = `${SITE_URL}${path}`;
  const canonical = canonicalUrl ? resolveUrl(canonicalUrl) : url;
  const ogImage = ogImagePath ? resolveUrl(ogImagePath) : undefined;
  const ogTitle = socialTitle || title;
  const ogDescription = socialDescription || description;

  const resolvedRobots = robots
    ? {
        index: robots.index ?? true,
        follow: robots.follow ?? true,
        ...(robots.noimageindex ? { noimageindex: true } : {}),
        ...(robots.noarchive ? { noarchive: true } : {}),
        ...(robots.nosnippet ? { nosnippet: true } : {}),
        ...(robots.notranslate ? { notranslate: true } : {}),
      }
    : { index: !noindex, follow: true };

  return {
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: { canonical },
    robots: resolvedRobots,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
      ...(twitterSite ? { site: twitterSite } : {}),
      ...(twitterCreator ? { creator: twitterCreator } : {}),
    },
  };
}
