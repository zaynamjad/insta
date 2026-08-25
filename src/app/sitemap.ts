import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { allLandingPages } from "@/content/landing-pages";
import { blogIndex } from "@/content/blog-index";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/blog/`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/about/`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/contact/`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacy-policy/`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms/`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/disclaimer/`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const landingRoutes: MetadataRoute.Sitemap = allLandingPages.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogIndex.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}/`,
    lastModified: new Date(post.datePublished),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...landingRoutes, ...blogRoutes];
}
