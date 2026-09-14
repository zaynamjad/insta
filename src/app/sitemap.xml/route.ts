import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { buildLanguageAlternates } from "@/i18n/alternates";

const ROUTES = [
  { pathname: "/", changeFrequency: "daily", priority: 1.0 },
  { pathname: "/about-us", changeFrequency: "monthly", priority: 0.3 },
  { pathname: "/contact-us", changeFrequency: "monthly", priority: 0.3 },
  { pathname: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
  { pathname: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.2 },
  { pathname: "/disclaimer", changeFrequency: "yearly", priority: 0.2 },
];

function withTrailingSlash(path: string): string {
  return path === "/" || path.endsWith("/") ? path : `${path}/`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const now = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

  for (const route of ROUTES) {
    const languages = buildLanguageAlternates(route.pathname);

    for (const locale of routing.locales) {
      const localizedPath = withTrailingSlash(
        getPathname({ href: route.pathname, locale })
      );
      const loc = `${SITE_URL}${localizedPath}`;

      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(loc)}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>${route.changeFrequency}</changefreq>\n`;
      xml += `    <priority>${route.priority.toFixed(1)}</priority>\n`;

      if (languages) {
        for (const [lang, href] of Object.entries(languages)) {
          xml += `    <xhtml:link rel="alternate" hreflang="${escapeXml(
            lang
          )}" href="${escapeXml(href)}" />\n`;
        }
      }

      xml += `  </url>\n`;
    }
  }

  xml += `</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
