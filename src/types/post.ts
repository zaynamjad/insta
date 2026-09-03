import type { ProviderErrorCode } from "@/lib/story/provider";

export type PostMediaType = "image" | "video";

export interface PostMediaItem {
  type: PostMediaType;
  mediaUrl: string;
  thumbnailUrl: string | null;
}

/**
 * A single feed post. `items` holds one entry for an image/video post, or
 * multiple for a carousel — the UI doesn't need to special-case carousels,
 * it just renders whatever `items` contains.
 */
export interface Post {
  id: string;
  shortcode: string | null;
  caption: string | null;
  timestamp: string | null;
  likeCount: number | null;
  commentCount: number | null;
  items: PostMediaItem[];
}

export type PostsErrorCode = ProviderErrorCode | "INVALID_USERNAME" | "INVALID_REQUEST" | "NOT_SUPPORTED";

export type PostsLookupResult =
  | { status: "ok"; posts: Post[] }
  | { status: "not_found"; username: string }
  | { status: "private"; username: string }
  | { status: "error"; code: PostsErrorCode; message: string };
