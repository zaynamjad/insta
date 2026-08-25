import type { Story } from "./story";

/**
 * Publicly available Instagram profile summary.
 *
 * Every field is nullable because it's only ever populated when the
 * public-web retrieval layer genuinely found it — nothing here is ever
 * invented or guessed to fill a gap.
 */
export interface Profile {
  username: string;
  profileImage: string | null;
  fullName: string | null;
  bio: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  isVerified: boolean;
  isPublic: boolean;
  stories: Story[];
}
