/**
 * Environment-driven configuration for the hybrid (Instaloader + HikerAPI)
 * backend: cache TTLs, the Instaloader connection, HikerAPI spend guards and
 * the provider circuit breaker. Every value has a safe default, so with no
 * new environment variables the app behaves like the pre-hybrid app (just
 * with longer-lived shared caching), and Instaloader stays off.
 *
 * Values are read on each call (not frozen at import) so a changed env var
 * on a new deployment — and tests — take effect without module reloads.
 */

export interface CacheTtls {
  /** Profile metadata (bio, counts, avatar, user id). */
  profileS: number;
  /** Short-lived answers: a private profile (its owner can flip it public any time) and empty listings. */
  shortS: number;
  /** Posts/Reels listing — the UI filters one combined list, so Reels share this TTL. */
  postsS: number;
  /** Active Stories; they expire after 24h and are the most time-sensitive data. */
  storiesS: number;
  highlightsS: number;
  /** Single post / single highlight (media metadata). */
  mediaS: number;
  /** "Not found" answers: kept briefly so typos don't hammer a provider. */
  negativeS: number;
}

export type InstaloaderStatus =
  | { state: "disabled" }
  | { state: "misconfigured"; problem: string }
  | { state: "ready"; url: string; secret: string; timeoutMs: number };

export interface HybridConfig {
  ttl: CacheTtls;
  instaloader: InstaloaderStatus;
  hiker: {
    /** Hard cap on HikerAPI HTTP calls one visitor request may make (key rotation included). */
    maxCallsPerRequest: number;
    /** Estimated billable units per calendar month; 0 disables threshold alerts. */
    monthlyUnitLimit: number;
  };
  breaker: {
    failureThreshold: number;
    failureWindowS: number;
    openForS: number;
  };
}

type Env = Record<string, string | undefined>;

function positiveInt(env: Env, name: string, fallback: number, min = 1): number {
  const raw = env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && Number.isInteger(n) && n >= min ? n : fallback;
}

function instaloaderUrl(env: Env): string | null {
  if (env.INSTALOADER_URL) return env.INSTALOADER_URL.replace(/\/+$/, "");
  // The function is deployed in this same Vercel project, so it is reachable on its production domain.
  const host = env.VERCEL_PROJECT_PRODUCTION_URL;
  return host ? `https://${host}/api/ig_fetch` : null;
}

export function getInstaloaderStatus(env: Env = process.env): InstaloaderStatus {
  if ((env.INSTALOADER_ENABLED ?? "").toLowerCase() !== "true") return { state: "disabled" };
  if (!env.INSTALOADER_SECRET) {
    return { state: "misconfigured", problem: "INSTALOADER_SECRET is required when INSTALOADER_ENABLED=true." };
  }
  const url = instaloaderUrl(env);
  if (!url) {
    return {
      state: "misconfigured",
      problem: "INSTALOADER_URL is required when INSTALOADER_ENABLED=true outside a Vercel deployment.",
    };
  }
  // Only ever call our own function over https (SSRF guard); http is allowed for localhost development only.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { state: "misconfigured", problem: "INSTALOADER_URL is not a valid URL." };
  }
  const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) {
    return { state: "misconfigured", problem: "INSTALOADER_URL must use https." };
  }
  return {
    state: "ready",
    // A trailing slash matches the app's `trailingSlash: true`; without it Vercel answers with a redirect.
    url: parsed.toString().endsWith("/") ? parsed.toString() : `${parsed.toString()}/`,
    secret: env.INSTALOADER_SECRET,
    timeoutMs: positiveInt(env, "INSTALOADER_TIMEOUT_MS", 5000, 500),
  };
}

export function getHybridConfig(env: Env = process.env): HybridConfig {
  return {
    ttl: {
      profileS: positiveInt(env, "CACHE_TTL_PROFILE_S", 6 * 3600),
      shortS: positiveInt(env, "CACHE_TTL_SHORT_S", 10 * 60),
      postsS: positiveInt(env, "CACHE_TTL_POSTS_S", 30 * 60),
      storiesS: positiveInt(env, "CACHE_TTL_STORIES_S", 2 * 60),
      highlightsS: positiveInt(env, "CACHE_TTL_HIGHLIGHTS_S", 6 * 3600),
      mediaS: positiveInt(env, "CACHE_TTL_MEDIA_S", 3600),
      negativeS: positiveInt(env, "CACHE_TTL_NEGATIVE_S", 30),
    },
    instaloader: getInstaloaderStatus(env),
    hiker: {
      maxCallsPerRequest: positiveInt(env, "HIKERAPI_MAX_CALLS_PER_REQUEST", 4),
      monthlyUnitLimit: positiveInt(env, "HIKERAPI_MONTHLY_UNIT_LIMIT", 0, 0),
    },
    breaker: {
      failureThreshold: positiveInt(env, "BREAKER_FAILURE_THRESHOLD", 3),
      failureWindowS: positiveInt(env, "BREAKER_FAILURE_WINDOW_S", 60),
      openForS: positiveInt(env, "BREAKER_OPEN_S", 300),
    },
  };
}
