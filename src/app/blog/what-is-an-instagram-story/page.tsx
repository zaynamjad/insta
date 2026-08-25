import type { Metadata } from "next";
import Link from "next/link";
import { BlogPostLayout } from "@/components/BlogPostLayout";
import { buildMetadataWithOverrides } from "@/lib/admin/apply-overrides";
import { blogIndex } from "@/content/blog-index";

const post = blogIndex.find((p) => p.slug === "what-is-an-instagram-story")!;
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
        An Instagram Story is a photo or short video that appears in a
        full-screen, tap-through format at the top of the Instagram app and
        automatically disappears 24 hours after it&apos;s posted, unless the
        poster saves it to a permanent Highlight on their profile.
      </p>

      <h2>How long do Instagram Stories last?</h2>
      <p>
        24 hours from the moment they&apos;re posted. After that, they&apos;re
        removed from the Stories bar automatically and are no longer visible
        to anyone browsing normally — this tool included, since it only
        ever surfaces currently active Stories.
      </p>

      <h2>What happens when a Story expires?</h2>
      <p>
        It disappears from the account&apos;s Story tray. The poster can
        still find it in their personal archive (visible only to them,
        assuming they haven&apos;t turned archiving off), but it&apos;s gone
        from public view unless they had already added it to a Highlight.
      </p>

      <h2>Stories vs. regular posts</h2>
      <table>
        <thead>
          <tr>
            <th>Feed post</th>
            <th>Story</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Stays on the profile grid indefinitely</td>
            <td>Disappears after 24 hours</td>
          </tr>
          <tr>
            <td>Supports likes and public comments</td>
            <td>Supports private replies and reactions only</td>
          </tr>
          <tr>
            <td>Static grid layout</td>
            <td>Full-screen, tap-through format</td>
          </tr>
        </tbody>
      </table>

      <h2>Who can see a Story?</h2>
      <p>
        For a public account, anyone — followers or not. For a private
        account, only approved followers, with the exception of any accounts
        the poster has specifically excluded.
      </p>

      <p>
        For how Stories relate to the permanent Highlights on a profile, see{" "}
        <Link href="/blog/instagram-stories-vs-highlights/">
          Instagram Stories vs. Highlights
        </Link>
        .
      </p>
    </BlogPostLayout>
  );
}
