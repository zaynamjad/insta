import type { Profile } from "@/types/profile";

/**
 * Thrown by a provider implementation when a lookup can't be completed.
 * The route handler maps this to a sanitized, user-facing message — the
 * `detail` field is for server-side logs only and must never reach the
 * client.
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/**
 * Every Instagram data source (current or future) implements this
 * contract. Nothing outside `lib/story` and the routes that call it may
 * depend on a specific provider's retrieval mechanism — swapping the
 * implementation must never require frontend changes.
 */
export interface StoryProvider {
  /**
   * Resolves a public profile summary for a username, including whatever
   * Stories the provider is actually able to retrieve (may always be
   * empty, depending on the implementation's capabilities — see
   * `PublicWebStoryProvider`). Returns `null` when the profile does not
   * exist. A private profile is a valid, expected result (`isPublic:
   * false`), not an error.
   */
  getProfile(username: string): Promise<Profile | null>;
}
