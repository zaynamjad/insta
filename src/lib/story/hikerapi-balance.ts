const HIKERAPI_BASE = "https://api.hikerapi.com";
const FETCH_TIMEOUT_MS = 10_000;

export interface HikerApiBalance {
  requests: number;
  rate: number;
  currency: string;
  amount: number;
}

export type KeyBalanceResult =
  | { status: "ok"; balance: HikerApiBalance }
  | { status: "invalid" } // the key itself was rejected (401/403)
  | { status: "error"; message: string };

/**
 * `/sys/balance` is explicitly documented by HikerAPI as free — "Calling
 * this endpoint is free — it does not consume a request" — so this is
 * safe to call from the admin dashboard on every load, unlike any of the
 * real lookup endpoints.
 */
export async function getKeyBalance(key: string): Promise<KeyBalanceResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${HIKERAPI_BASE}/sys/balance`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json", "x-access-key": key },
    });

    if (res.status === 401 || res.status === 403) return { status: "invalid" };
    if (!res.ok) return { status: "error", message: `HTTP ${res.status}` };

    const body = (await res.json()) as Partial<HikerApiBalance>;
    if (
      typeof body.requests !== "number" ||
      typeof body.amount !== "number" ||
      typeof body.currency !== "string"
    ) {
      return { status: "error", message: "Unexpected response shape." };
    }

    return {
      status: "ok",
      balance: {
        requests: body.requests,
        rate: typeof body.rate === "number" ? body.rate : 0,
        currency: body.currency,
        amount: body.amount,
      },
    };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return { status: "error", message: isTimeout ? "Timed out." : "Failed to reach HikerAPI." };
  } finally {
    clearTimeout(timer);
  }
}
