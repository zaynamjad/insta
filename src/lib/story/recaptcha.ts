const API_KEY = process.env.RECAPTCHA_API_KEY;
const PROJECT_ID = process.env.RECAPTCHA_PROJECT_ID;
const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

/** Must match the `action` the client passes to grecaptcha.enterprise.render(). */
export const RECAPTCHA_ACTION = "SEARCH";

export const RECAPTCHA_SERVER_ENABLED = Boolean(API_KEY && PROJECT_ID && SITE_KEY);

/**
 * Verifies a reCAPTCHA Enterprise token by creating an assessment. When
 * RECAPTCHA_API_KEY / RECAPTCHA_PROJECT_ID / NEXT_PUBLIC_RECAPTCHA_SITE_KEY
 * aren't all configured, the gate is a no-op (returns true) — same
 * graceful-degradation shape as the rest of this project's optional integrations.
 */
export async function verifyRecaptchaToken(
  token: unknown,
  remoteIp: string,
  expectedAction?: string,
): Promise<boolean> {
  if (!RECAPTCHA_SERVER_ENABLED) return true;
  if (typeof token !== "string" || !token) return false;

  const event: Record<string, string> = { token, siteKey: SITE_KEY! };
  if (expectedAction) event.expectedAction = expectedAction;
  if (remoteIp && remoteIp !== "unknown") event.userIpAddress = remoteIp;

  try {
    const res = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(PROJECT_ID!)}/assessments?key=${encodeURIComponent(API_KEY!)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as {
      tokenProperties?: { valid?: boolean; action?: string };
    };
    const props = data.tokenProperties;
    if (props?.valid !== true) return false;
    if (expectedAction && props.action && props.action !== expectedAction) return false;
    return true;
  } catch {
    return false;
  }
}

/** Gate for the search routes: the body must carry a valid `recaptchaToken` (no-op when unconfigured). */
export async function verifySearchRequest(body: unknown, remoteIp: string): Promise<boolean> {
  const token =
    typeof body === "object" && body !== null && "recaptchaToken" in body
      ? (body as { recaptchaToken: unknown }).recaptchaToken
      : undefined;
  return verifyRecaptchaToken(token, remoteIp, RECAPTCHA_ACTION);
}
