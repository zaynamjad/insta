import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/site";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SchemaObject = Record<string, any>;

export function websiteSchema(): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/instagram-story-viewer/?u={username}`,
      },
      "query-input": "required name=username",
    },
  };
}

export function organizationSchema(): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
  };
}

export function softwareApplicationSchema(): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${SITE_NAME} — Instagram Story Viewer`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqPageSchema(items: FaqItem[]): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export interface ProfilePageSchemaArgs {
  username: string;
  fullName: string | null;
  bio: string | null;
  profileImage: string | null;
  path: string;
}

export function profilePageSchema(args: ProfilePageSchemaArgs): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${SITE_URL}${args.path}`,
    mainEntity: {
      "@type": "Person",
      name: args.fullName ?? args.username,
      alternateName: `@${args.username}`,
      ...(args.bio ? { description: args.bio } : {}),
      ...(args.profileImage ? { image: args.profileImage } : {}),
    },
  };
}

export interface ArticleSchemaArgs {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
}

export function articleSchema(args: ArticleSchemaArgs): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: args.headline,
    description: args.description,
    url: `${SITE_URL}${args.path}`,
    datePublished: args.datePublished,
    dateModified: args.dateModified ?? args.datePublished,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${args.path}` },
  };
}
