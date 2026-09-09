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
  /** Highest-resolution profile picture available, when the provider exposes one separately from `profileImage`. Falls back to `profileImage`. */
  profileImageHd: string | null;
  fullName: string | null;
  bio: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  isVerified: boolean;
  isPublic: boolean;
  stories: Story[];
  /** Business/creator category label (e.g. "Clothing (brand)"), when Instagram exposes one. */
  category: string | null;
  /** The single external link shown on the profile, if any. */
  externalUrl: string | null;
}
