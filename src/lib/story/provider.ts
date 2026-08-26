import type { Profile } from "@/types/profile";

/**
 * Machine-readable reason a lookup failed, surfaced to the client
 * alongside a human-readable message. `CONTENT_UNAVAILABLE` specifically
 * means: the public web genuinely does not expose the requested data —
 * see `docs/story-retrieval-limitations.md` for why that's the permanent
 * answer for Stories, not a transient one.
 */
export type ProviderErrorCode =
  | "CONTENT_UNAVAILABLE"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_ERROR"
  | "RATE_LIMITED";

/**
 * Thrown by a provider implementation when a lookup can't be completed.
 * The route handler maps this to a sanitized, user-facing message — the
 * `detail` field is for server-side logs only and must never reach the
 * client.
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: ProviderErrorCode = "UPSTREAM_ERROR",
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
