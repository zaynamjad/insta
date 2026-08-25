import type { Metadata } from "next";
import { buildMetadata, type RobotsFlags } from "@/lib/seo/metadata";
import { getPageSettingsSafe } from "./settings-store";

interface BaseMetadataArgs {
  title: string;
  description: string;
  path: string;
  ogImagePath?: string;
  noindex?: boolean;
}

/**
 * Async, override-aware wrapper around `buildMetadata()`. Safe to call
 * from a static `generateMetadata()` — a missing/unconfigured store
 * degrades to the page's built-in defaults rather than throwing, so this
 * never breaks a build or a render.
 */
export async function buildMetadataWithOverrides(base: BaseMetadataArgs): Promise<Metadata> {
  const overrides = await getPageSettingsSafe(base.path);
  if (!overrides) return buildMetadata(base);

  const robots: RobotsFlags = {
    index: overrides.robotsIndex === "index",
    follow: overrides.robotsFollow === "follow",
    noimageindex: overrides.robotsNoImageIndex,
    noarchive: overrides.robotsNoArchive,
    nosnippet: overrides.robotsNoSnippet,
    notranslate: overrides.robotsNoTranslate,
  };

  const keywords = overrides.metaKeywords
    ? overrides.metaKeywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;

  return buildMetadata({
    title: overrides.metaTitle || base.title,
    description: overrides.metaDescription || base.description,
    path: base.path,
    ogImagePath:
      overrides.useDefaultImageForSocial || !overrides.socialImageUrl
        ? base.ogImagePath
        : overrides.socialImageUrl,
    keywords,
    socialTitle: overrides.useSeoTitleForSocial ? undefined : overrides.socialTitle || undefined,
    socialDescription: overrides.useSeoDescriptionForSocial
      ? undefined
      : overrides.socialDescription || undefined,
    twitterSite: overrides.twitterSite || undefined,
    twitterCreator: overrides.twitterCreator || undefined,
    robots,
    canonicalUrl:
      overrides.canonicalMode === "custom" && overrides.canonicalUrl
        ? overrides.canonicalUrl
        : undefined,
  });
}

export interface RenderOverrides {
  /** Parsed custom JSON-LD, added alongside (not instead of) the page's built-in schema. */
  schemaJsonLd: Record<string, unknown> | null;
  /** Raw, admin-authored HTML — safe to render because it only ever originates from an authenticated save action, never from public input. */
  headerScriptsHtml: string | null;
}

export async function getRenderOverrides(path: string): Promise<RenderOverrides> {
  const overrides = await getPageSettingsSafe(path);
  if (!overrides) return { schemaJsonLd: null, headerScriptsHtml: null };

  let schemaJsonLd: Record<string, unknown> | null = null;
  if (overrides.schemaJsonLd.trim()) {
    try {
      const parsed = JSON.parse(overrides.schemaJsonLd);
      if (parsed && typeof parsed === "object") schemaJsonLd = parsed;
    } catch {
      // Invalid JSON should have been rejected at save time; render nothing rather than break the page.
      schemaJsonLd = null;
    }
  }

  const headerScriptsHtml =
    !overrides.disableHeaderScripts && overrides.headerScripts.trim()
      ? overrides.headerScripts
      : null;

  return { schemaJsonLd, headerScriptsHtml };
}
