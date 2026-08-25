export interface BlogIndexEntry {
  slug: string;
  title: string;
  description: string;
  category: "Guide" | "Educational" | "Comparison";
  datePublished: string;
}

export const blogIndex: BlogIndexEntry[] = [
  {
    slug: "how-to-view-instagram-stories-anonymously",
    title: "How to View Instagram Stories Anonymously",
    description:
      "A practical walkthrough of how anonymous Story viewing actually works, what it does and doesn't protect, and how to do it for public accounts.",
    category: "Guide",
    datePublished: "2026-01-12",
  },
  {
    slug: "instagram-story-viewer-without-login-guide",
    title: "Instagram Story Viewer Without Login: Full Guide",
    description:
      "Everything you need to know about viewing public Instagram Stories without signing into an Instagram account.",
    category: "Guide",
    datePublished: "2026-01-19",
  },
  {
    slug: "can-someone-see-if-you-viewed-their-instagram-story",
    title: "Can Someone See If You Viewed Their Instagram Story?",
    description:
      "How Instagram's Story viewer list actually works, what it shows the account owner, and when your identity is or isn't attached to a view.",
    category: "Educational",
    datePublished: "2026-01-26",
  },
  {
    slug: "what-is-an-instagram-story",
    title: "What Is an Instagram Story? A Complete Overview",
    description:
      "A clear definition of Instagram Stories, how they differ from posts, how long they last, and who can see them.",
    category: "Educational",
    datePublished: "2026-02-02",
  },
  {
    slug: "instagram-stories-vs-highlights",
    title: "Instagram Stories vs. Highlights: What's the Difference?",
    description:
      "Stories and Highlights look similar but behave very differently. Here's how each one works and when Instagram uses which.",
    category: "Comparison",
    datePublished: "2026-02-09",
  },
];
