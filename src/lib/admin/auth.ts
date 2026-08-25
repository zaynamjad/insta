import "server-only";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "./session";

export { ADMIN_SESSION_COOKIE, checkAdminCredentials, createSessionToken, SESSION_MAX_AGE_SECONDS } from "./session";

/**
 * The Data Access Layer's auth check — call this at the top of every
 * admin page AND independently inside every admin Server Action. A
 * page-level check does not extend to Server Actions defined within it
 * (see Next.js's Data Security guide); every mutation re-verifies here.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_SESSION_COOKIE)?.value);
}
