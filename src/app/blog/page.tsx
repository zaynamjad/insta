import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadataWithOverrides } from "@/lib/admin/apply-overrides";
import { PageOverridesRenderer } from "@/components/admin/PageOverridesRenderer";
import { blogIndex } from "@/content/blog-index";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadataWithOverrides({
    title: "Instagram Story Guides & Educational Articles",
    description:
      "Guides and explainers on how Instagram Stories work — anonymous viewing, login-free access, Story viewer lists, and how Stories compare to Highlights.",
    path: "/blog/",
  });
}

export default function BlogIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <PageOverridesRenderer path="/blog/" />
      <Breadcrumbs items={[{ name: "Guides", path: "/blog/" }]} />

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Instagram Story Guides
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-foreground/70">
        Straightforward explainers on how Instagram Stories work — anonymous
        viewing, login-free access, and how the platform actually behaves
        behind the scenes.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {blogIndex.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}/`}
            className="group rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              {post.category}
            </span>
            <h2 className="mt-2 text-lg font-semibold text-foreground group-hover:text-accent">
              {post.title}
            </h2>
            <p className="mt-2 text-sm text-foreground/65">
              {post.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
