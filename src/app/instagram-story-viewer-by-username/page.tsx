import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";
import { buildMetadataWithOverrides } from "@/lib/admin/apply-overrides";
import { instagramStoryViewerByUsername as content } from "@/content/landing-pages";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadataWithOverrides({
    title: content.title,
    description: content.description,
    path: content.path,
  });
}

export default function Page() {
  return (
    <LandingPage
      {...content}
      breadcrumb={{ name: content.h1, path: content.path }}
    />
  );
}
