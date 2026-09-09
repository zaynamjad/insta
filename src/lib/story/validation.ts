const USERNAME_PATTERN = /^(?!.*\.\.)[a-zA-Z0-9._]{1,30}$/;

const RESERVED_PATHS = new Set([
  "p",
  "reel",
  "reels",
  "tv",
  "stories",
  "explore",
  "direct",
  "accounts",
  "developer",
  "about",
  "legal",
  "api",
]);

export interface UsernameValidation {
  valid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Validates and normalizes an Instagram username per Instagram's public
 * handle rules: 1-30 characters, letters/numbers/periods/underscores,
 * no consecutive periods. Also handles leading `@` and pasted profile/story URLs.
 */
export function validateUsername(input: unknown): UsernameValidation {
  if (typeof input !== "string") {
    return { valid: false, normalized: "", error: "Username is required." };
  }

  let trimmed = input.trim();

  // If user pasted a profile URL or user story URL, extract username:
  // e.g. https://www.instagram.com/cristiano/ or instagram.com/stories/cristiano/
  const urlMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:stories\/)?([a-zA-Z0-9._]{1,30})(?:\/\d+)?\/?(?:\?.*)?$/i
  );
  if (urlMatch && urlMatch[1] && !RESERVED_PATHS.has(urlMatch[1].toLowerCase())) {
    trimmed = urlMatch[1];
  }

  // Strip leading @ symbols if present (e.g. @cristiano -> cristiano)
  trimmed = trimmed.replace(/^@+/, "");

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
