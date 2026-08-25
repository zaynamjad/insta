import type { Metadata } from "next";
import Link from "next/link";
import { BlogPostLayout } from "@/components/BlogPostLayout";
import { buildMetadataWithOverrides } from "@/lib/admin/apply-overrides";
import { blogIndex } from "@/content/blog-index";

const post = blogIndex.find(
  (p) => p.slug === "instagram-stories-vs-highlights",
)!;
const path = `/blog/${post.slug}/`;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadataWithOverrides({
    title: post.title,
    description: post.description,
    path,
  });
}

export default function Page() {
  return (
    <BlogPostLayout
      title={post.title}
      description={post.description}
      path={path}
      datePublished={post.datePublished}
      readingTime="3 min"
    >
      <p>
        Stories and Highlights look identical on screen — the same
        full-screen, tap-through format — but they behave very differently.
        A Story is temporary; a Highlight is a permanent collection built
        from Stories the account owner chose to keep.
      </p>

      <h2>The core difference</h2>
      <ul>
        <li>
          <strong>Story:</strong> disappears automatically 24 hours after
          posting.
        </li>
        <li>
          <strong>Highlight:</strong> a curated group of past Stories the
          account owner saved to a labeled circle on their profile, where it
          stays indefinitely until manually removed.
        </li>
      </ul>

      <h2>Where each one appears</h2>
      <p>
        Active Stories show as rings around profile pictures at the top of
        the app and in the Stories bar. Highlights live permanently on the
        profile itself, just below the bio, as labeled circles (e.g.
        &quot;Travel,&quot; &quot;2025,&quot; &quot;FAQ&quot;).
      </p>

      <h2>Does adding a Story to Highlights stop it from expiring?</h2>
      <p>
        Yes — once a Story is added to a Highlight, a copy of it persists on
        the profile permanently, even after the original 24-hour Story
        window has passed.
      </p>

      <h2>Which one does a Story viewer tool show?</h2>
      <p>
        Only currently active Stories — the temporary kind. A public
        account&apos;s Highlights are a separate, permanent part of their
        profile and aren&apos;t part of what a{" "}
        <Link href="/instagram-story-viewer/">Story viewer</Link> retrieves.
      </p>
    </BlogPostLayout>
  );
}
