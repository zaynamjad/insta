const USERNAME_PATTERN = /^(?!.*\.\.)[a-zA-Z0-9._]{1,30}$/;

export interface UsernameValidation {
  valid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Validates and normalizes an Instagram username per Instagram's public
 * handle rules: 1-30 characters, letters/numbers/periods/underscores,
 * no consecutive periods.
 *
 * This is also the project's SSRF boundary: `PublicWebStoryProvider` only
 * ever constructs a fetch URL from a username that has passed this check,
 * so the target host/path is always `https://www.instagram.com/<validated>/`
 * — never a URL supplied directly by a client.
 */
export function validateUsername(input: unknown): UsernameValidation {
  if (typeof input !== "string") {
    return { valid: false, normalized: "", error: "Username is required." };
  }

  const trimmed = input.trim().replace(/^@/, "");
  const normalized = trimmed.toLowerCase();

  if (normalized.length === 0) {
    return { valid: false, normalized, error: "Enter an Instagram username." };
  }

  if (normalized.length > 30) {
    return { valid: false, normalized, error: "That username is too long." };
  }

  if (!USERNAME_PATTERN.test(normalized)) {
    return {
      valid: false,
      normalized,
      error:
        "Usernames can only contain letters, numbers, periods, and underscores.",
    };
  }

  return { valid: true, normalized };
}
