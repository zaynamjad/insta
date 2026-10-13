const SCRAPECREATORS_BASE = "https://api.scrapecreators.com";
const FETCH_TIMEOUT_MS = 10_000;

export type ScrapeCreatorsBalanceResult =
  | { status: "ok"; credits: number }
  | { status: "invalid" } // the key itself was rejected (401/403)
  | { status: "error"; message: string };

/**
 * `GET /v1/account/credit-balance` — used only by the dashboard's explicit
 * "Test connection" button, never on page load or per lookup, so it can't
 * burn credits through polling.
 */
export async function getScrapeCreatorsBalance(key: string): Promise<ScrapeCreatorsBalanceResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${SCRAPECREATORS_BASE}/v1/account/credit-balance`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json", "x-api-key": key },
    });

    if (res.status === 401 || res.status === 403) return { status: "invalid" };
    if (!res.ok) return { status: "error", message: `HTTP ${res.status}` };

    const body = (await res.json()) as { creditCount?: unknown; credits_remaining?: unknown };
    const credits = typeof body.creditCount === "number" ? body.creditCount : body.credits_remaining;
    if (typeof credits !== "number") {
      return { status: "error", message: "Unexpected response shape." };
    }
    return { status: "ok", credits };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return { status: "error", message: isTimeout ? "Timed out." : "Failed to reach Scrape Creators." };
  } finally {
    clearTimeout(timer);
  }
}
