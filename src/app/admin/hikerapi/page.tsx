import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/admin-auth";
import { getStoredKeys, getEnvKeys, type StoredHikerApiKey } from "@/lib/story/key-store";
import { getKeyBalance, type KeyBalanceResult } from "@/lib/story/hikerapi-balance";

// Belt and suspenders alongside the robots.txt disallow and the proxy's
// i18n-middleware exclusion: this page lists and edits paid API
// credentials, so it must never be indexed even if something links to it.
export const metadata: Metadata = {
  title: "HikerAPI keys",
  robots: { index: false, follow: false, nocache: true },
};

function maskKey(key: string): string {
  if (key.length <= 10) return "•".repeat(Math.max(4, key.length));
  return `${key.slice(0, 6)}${"•".repeat(key.length - 10)}${key.slice(-4)}`;
}

function formatBalance(result: KeyBalanceResult): string {
  if (result.status === "ok") {
    const { amount, currency, requests, rate } = result.balance;
    return `${amount.toFixed(2)} ${currency} · ${requests.toLocaleString()} requests left · ${rate}/s rate limit`;
  }
  if (result.status === "invalid") return "Key rejected by HikerAPI (invalid or revoked)";
  return `Couldn't check balance (${result.message})`;
}

function balanceTone(result: KeyBalanceResult): string {
  if (result.status === "ok") {
    return result.balance.requests <= 0 ? "text-red-500" : "text-foreground/70";
  }
  return "text-amber-500";
}

export default async function HikerApiAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const cookieStore = await cookies();
  const authed = isValidSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!authed) {
    return <LoginView error={error} />;
  }

  const [storedKeys, envKeys] = await Promise.all([getStoredKeys(), Promise.resolve(getEnvKeys())]);
  const storedBalances = await Promise.all(storedKeys.map((k) => getKeyBalance(k.key)));
  const envBalances = await Promise.all(envKeys.map((k) => getKeyBalance(k)));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">HikerAPI keys</h1>
        <form action="/admin/hikerapi/logout" method="POST">
          <button
            type="submit"
            className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground/70 hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
      <p className="mt-1 text-sm text-foreground/60">
        These are tried in order on every search — the first one still working wins. Balances are free
        to check (HikerAPI doesn&apos;t bill <code>/sys/balance</code>) and are refreshed every time
        you load this page.
      </p>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-500">
          {error}
        </p>
      )}

      <section className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground/80">Add a key</h2>
        <form action="/admin/hikerapi/keys" method="POST" className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input type="hidden" name="intent" value="add" />
          <input
            type="text"
            name="label"
            placeholder="Label (optional — e.g. Primary)"
            className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm outline-none sm:w-48"
          />
          <input
            type="text"
            name="key"
            required
            placeholder="HikerAPI access key"
            className="flex-1 rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="brand-gradient shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white"
          >
            Add key
          </button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-foreground/80">
          Dashboard-managed keys ({storedKeys.length})
        </h2>
        {storedKeys.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/50">
            No keys added here yet — the site is still running on whatever is below under
            &quot;Environment-variable keys&quot;, if any.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {storedKeys.map((k, i) => (
              <KeyCard key={k.id} index={i + 1} entry={k} balance={storedBalances[i]} />
            ))}
          </ul>
        )}
      </section>

      {envKeys.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-foreground/80">
            Environment-variable keys ({envKeys.length})
          </h2>
          <p className="mt-1 text-xs text-foreground/50">
            From <code>HIKERAPI_KEY</code> / <code>HIKERAPI_Fallback_N_KEY</code>. Still tried after the
            keys above — edit these from the Vercel dashboard, not here.
          </p>
          <ul className="mt-3 space-y-2">
            {envKeys.map((key, i) => (
              <li
                key={i}
                className="flex flex-col gap-1 rounded-xl border border-border bg-surface-muted px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <code className="text-sm text-foreground/80">{maskKey(key)}</code>
                <span className={`text-xs ${balanceTone(envBalances[i])}`}>{formatBalance(envBalances[i])}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function KeyCard({
  index,
  entry,
  balance,
}: {
  index: number;
  entry: StoredHikerApiKey;
  balance: KeyBalanceResult;
}) {
  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-foreground/40">#{index}</span>{" "}
          <span className="text-sm font-semibold">{entry.label}</span>
          <code className="ml-2 text-xs text-foreground/50">{maskKey(entry.key)}</code>
        </div>
        <span className={`text-xs ${balanceTone(balance)}`}>{formatBalance(balance)}</span>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-medium text-accent">Replace this key</summary>
        <form action="/admin/hikerapi/keys" method="POST" className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="intent" value="replace" />
          <input type="hidden" name="id" value={entry.id} />
          <input
            type="text"
            name="label"
            defaultValue={entry.label}
            className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm outline-none sm:w-40"
          />
          <input
            type="text"
            name="key"
            required
            placeholder="New key value"
            className="flex-1 rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted"
          >
            Save
          </button>
        </form>
      </details>

      <form action="/admin/hikerapi/keys" method="POST" className="mt-2">
        <input type="hidden" name="intent" value="remove" />
        <input type="hidden" name="id" value={entry.id} />
        <button type="submit" className="text-xs font-medium text-red-500 hover:underline">
          Remove
        </button>
      </form>
    </li>
  );
}

function LoginView({ error }: { error?: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4">
      <h1 className="text-xl font-bold tracking-tight">HikerAPI keys</h1>
      <p className="mt-1 text-sm text-foreground/60">Sign in to manage keys and check balances.</p>
      <form action="/admin/hikerapi/login" method="POST" className="mt-6 flex flex-col gap-3">
        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-500">
            {error}
          </p>
        )}
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Admin password"
          className="rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm outline-none"
        />
        <button type="submit" className="brand-gradient rounded-xl px-4 py-2.5 text-sm font-semibold text-white">
          Sign in
        </button>
      </form>
    </div>
  );
}
