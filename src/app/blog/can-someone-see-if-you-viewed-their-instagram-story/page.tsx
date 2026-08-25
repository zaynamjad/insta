import type { Metadata } from "next";
import Link from "next/link";
import { BlogPostLayout } from "@/components/BlogPostLayout";
import { buildMetadataWithOverrides } from "@/lib/admin/apply-overrides";
import { blogIndex } from "@/content/blog-index";

const post = blogIndex.find(
  (p) => p.slug === "can-someone-see-if-you-viewed-their-instagram-story",
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
      readingTime="4 min"
    >
      <p>
        <strong>Short answer:</strong> yes, but only if you view the Story
        from your own logged-in Instagram account. Instagram maintains a
        list, visible to the Story&apos;s owner, of every account that
        opened it that way.
      </p>

      <h2>How Instagram&apos;s Story viewer list works</h2>
      <p>
        Whenever a logged-in account opens a Story, Instagram adds that
        account to a list only the Story&apos;s owner can see, ordered
        roughly by recency and engagement. There&apos;s no way to appear on
        that list without your account having actually opened the Story
        while logged in — and no native way to remove yourself afterward
        (aside from Instagram&apos;s separate &quot;Close Friends&quot; and
        block/restrict features, which are unrelated to this).
      </p>

      <h2>What doesn&apos;t add you to the list</h2>
      <ul>
        <li>Viewing a public account&apos;s Story through a tool that doesn&apos;t use your personal Instagram account to open it.</li>
        <li>Someone screenshotting or screen-recording a Story and sending it to you.</li>
        <li>Seeing a Story reshared as a post or in a group chat.</li>
      </ul>
      <p>
        This is the mechanism behind{" "}
        <Link href="/anonymous-instagram-story-viewer/">
          anonymous Story viewing
        </Link>
        : the view happens outside your personal, logged-in Instagram
        session, so it&apos;s never recorded on your account&apos;s behalf.
      </p>

      <h2>Does Instagram tell you who screenshotted your Story?</h2>
      <p>
        No — for regular Stories, Instagram does not notify you when someone
        takes a screenshot. (This is different from disappearing photo/video
        messages in Direct, where screenshot notifications have historically
        applied in some cases.)
      </p>

      <h2>Bottom line</h2>
      <p>
        The viewer list only reflects logged-in accounts that opened the
        Story natively in the app. If your account never opened it that
        way, it won&apos;t appear.
      </p>
    </BlogPostLayout>
  );
}
