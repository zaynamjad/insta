import type { StoryErrorCode } from "@/types/story";
import type { PostsErrorCode } from "@/types/post";

type Code = StoryErrorCode | PostsErrorCode;

/**
 * Server responses carry a stable `code` alongside an English `message` —
 * the message is for logs, never rendered. The UI always translates by
 * `code` instead, so error text stays in the visitor's language.
 */
const KEYS: Record<Code, string> = {
  CONTENT_UNAVAILABLE: "errorContentUnavailable",
  UPSTREAM_TIMEOUT: "errorUpstreamTimeout",
  UPSTREAM_ERROR: "errorUpstreamError",
  RATE_LIMITED: "errorRateLimited",
  INVALID_USERNAME: "errorInvalidUsername",
  INVALID_REQUEST: "errorInvalidRequest",
  NOT_SUPPORTED: "errorNotSupported",
};

export function errorMessageKey(code: Code): string {
  return KEYS[code] ?? "errorUpstreamError";
}
