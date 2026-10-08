import crypto from "node:crypto";

/**
 * Guards the `/admin/*` dashboard. Deliberately a single shared password
 * rather than real accounts — this is an internal tool for one owner, not
 * a multi-user surface, so a signed session cookie is enough: no database,
 * no user table, nothing to manage beyond one env var.
 */
export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getPassword(): string {
  const password = process.env.ADMIN_DASHBOARD_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_DASHBOARD_PASSWORD is not configured.");
  }
  return password;
}

// Derived rather than the raw password itself, so the HMAC key for signing
// session tokens isn't literally the plaintext password.
function getSigningKey(): string {
  return crypto
    .createHash("sha256")
    .update(`${getPassword()}:instaviewstories-admin-session`)
    .digest("hex");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSigningKey()).update(payload).digest("hex");
}

/** Timing-safe comparison against the configured password. */
export function checkPassword(input: string): boolean {
  let password: string;
  try {
    password = getPassword();
  } catch {
    return false;
  }
  const a = Buffer.from(input);
  const b = Buffer.from(password);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createSessionToken(): string {
  const expires = String(Date.now() + SESSION_TTL_MS);
  return `${expires}.${sign(expires)}`;
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig) return false;
  let expectedSig: string;
  try {
    expectedSig = sign(expires);
  } catch {
    return false;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const expiresAt = Number(expires);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}
