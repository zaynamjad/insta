import crypto from "crypto";

/**
 * Pure session-token crypto — deliberately has no dependency on
 * `next/headers` or `"server-only"` so it can be imported from `proxy.ts`
 * (which runs outside the normal request-rendering context) as well as
 * from Server Components and Server Actions.
 */

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

function getSigningSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET (or ADMIN_PASSWORD as a fallback) must be set to use admin login.",
    );
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSigningSecret()).update(payload).digest("hex");
}

/** Constant-time string comparison that doesn't leak length via early exit. */
function timingSafeStringEqual(a: string, b: string): boolean {
  const digestA = crypto.createHash("sha256").update(a).digest();
  const digestB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

export function checkAdminCredentials(username: string, password: string): boolean {
  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;
  if (!validUsername || !validPassword) return false;
  const usernameOk = timingSafeStringEqual(username, validUsername);
  const passwordOk = timingSafeStringEqual(password, validPassword);
  return usernameOk && passwordOk;
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `admin.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expiresAtStr, signature] = parts;
  if (role !== "admin") return false;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expectedSignature = sign(`${role}.${expiresAtStr}`);
  if (signature.length !== expectedSignature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
