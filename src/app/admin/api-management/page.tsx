import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/admin-auth";
import { getStoredKeys, getEnvKeys, type ApiProviderId, type StoredApiKey } from "@/lib/story/key-store";
import { getKeyBalance, type KeyBalanceResult } from "@/lib/story/hikerapi-balance";
import {
  getProviderSettings,
  otherProvider,
  PROVIDER_IDS,
  PROVIDER_LABELS,
  type ApiProviderSettings,
} from "@/lib/story/provider-settings";
import { getProviderStats, getRecentLog, type ProviderStats } from "@/lib/story/provider-stats";

// Belt and suspenders alongside the robots.txt disallow and the proxy's
// i18n-middleware exclusion: this page lists and edits paid API
// credentials, so it must never be indexed even if something links to it.
export const metadata: Metadata = {
  title: "API Management",
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

export default async function ApiManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;
  const cookieStore = await cookies();
  const authed = isValidSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!authed) {
    return <LoginView error={error} />;
  }

  const [settings, hikerStored, scStored, hikerStats, scStats, log] = await Promise.all([
    getProviderSettings(),
    getStoredKeys("hikerapi"),
    getStoredKeys("scrapecreators"),
    getProviderStats("hikerapi"),
    getProviderStats("scrapecreators"),
    getRecentLog(20),
  ]);
  const hikerEnv = getEnvKeys("hikerapi");
  const scEnv = getEnvKeys("scrapecreators");
  const hikerStoredBalances = await Promise.all(hikerStored.map((k) => getKeyBalance(k.key)));
  const hikerEnvBalances = await Promise.all(hikerEnv.map((k) => getKeyBalance(k)));

  const configured: Record<ApiProviderId, boolean> = {
    hikerapi: hikerStored.length + hikerEnv.length > 0,
    scrapecreators: scStored.length + scEnv.length > 0,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">API Management</h1>
        <form action="/admin/api-management/logout" method="POST">
          <button
            type="submit"
            className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground/70 hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
      <p className="mt-1 text-sm text-foreground/60">
        Manage API providers, credentials, priorities, fallback settings, and usage. Keys within a
        provider are tried in order — the first one still working wins.
      </p>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-500">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 text-sm text-emerald-600">
          {notice}
        </p>
      )}

      <RoutingSection settings={settings} configured={configured} />

      <ProviderSection
        provider="hikerapi"
        settings={settings}
        stats={hikerStats}
        stored={hikerStored}
        storedBalances={hikerStoredBalances}
        env={hikerEnv}
        envBalances={hikerEnvBalances}
        envHint={
          <>
            From <code>HIKERAPI_KEY</code> / <code>HIKERAPI_Fallback_N_KEY</code>. Still tried after the
            keys above — edit these from the Vercel dashboard, not here.
          </>
        }
        balanceNote="HikerAPI balances are free to check (/sys/balance) and refresh every time you load this page."
      />

      <ProviderSection
        provider="scrapecreators"
        settings={settings}
        stats={scStats}
        stored={scStored}
        env={scEnv}
        envHint={
          <>
            From <code>SCRAPECREATORS_API_KEY</code> / <code>SCRAPECREATORS_Fallback_N_KEY</code>. Still
            tried after the keys above — edit these from the Vercel dashboard, not here.
          </>
        }
        balanceNote="Scrape Creators credits are only checked when you press Test connection (and updated from each lookup's response), so this page never spends credits."
      />

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-foreground/80">Recent requests &amp; fallback history</h2>
        {log.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/50">
            Nothing recorded yet (activity is stored in Redis; none is kept if Redis isn&apos;t configured).
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {log.map((e, i) => (
              <li
                key={`${e.at}-${i}`}
                className="flex flex-col gap-0.5 rounded-xl border border-border bg-surface-muted px-4 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"
              >
                <span className={e.ok ? "text-foreground/80" : "text-red-500"}>
                  {e.ok ? "OK" : "Failed"} · {PROVIDER_LABELS[e.provider]}
                  {e.isFallback ? " (fallback)" : ""} · {e.operation} · {e.durationMs}ms
                  {e.error ? ` · ${e.error}` : ""}
                </span>
                <span className="text-foreground/40">{new Date(e.at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RoutingSection({
  settings,
  configured,
}: {
  settings: ApiProviderSettings;
  configured: Record<ApiProviderId, boolean>;
}) {
  const fallback = otherProvider(settings.primary);
  const inputCls = "rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm outline-none";
  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground/80">Provider priority</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Primary: <strong>{PROVIDER_LABELS[settings.primary]}</strong> · Fallback:{" "}
        <strong>
          {settings.fallbackEnabled ? PROVIDER_LABELS[fallback] : `${PROVIDER_LABELS[fallback]} (off)`}
        </strong>
      </p>
      <form action="/admin/api-management/settings" method="POST" className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-foreground/60 sm:w-72">
          Primary provider (the other becomes the Fallback automatically)
          <select name="primary" defaultValue={settings.primary} className={inputCls}>
            {PROVIDER_IDS.map((id) => (
              <option key={id} value={id}>
                {PROVIDER_LABELS[id]}
                {!configured[id] ? " — no key" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="fallbackEnabled" defaultChecked={settings.fallbackEnabled} />
          Automatically fail over to the Fallback provider on timeouts, rate limits, credit exhaustion and
          5xx errors
        </label>
        {PROVIDER_IDS.map((id) => (
          <label key={id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name={`enabled_${id}`} defaultChecked={settings.enabled[id]} />
            {PROVIDER_LABELS[id]} enabled
          </label>
        ))}
        <p className="text-xs text-foreground/50">
          A disabled or key-less provider can&apos;t be Primary. Scrape Creators has no Stories endpoint, so
          Story lookups always use HikerAPI while it&apos;s enabled and configured.
        </p>
        <button
          type="submit"
          className="brand-gradient self-start rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          Save configuration
        </button>
      </form>
    </section>
  );
}

function roleOf(settings: ApiProviderSettings, id: ApiProviderId): string {
  if (settings.primary === id) return "Primary";
  return settings.fallbackEnabled ? "Fallback" : "Fallback (off)";
}

function ProviderSection({
  provider,
  settings,
  stats,
  stored,
  storedBalances,
  env,
  envBalances,
  envHint,
  balanceNote,
}: {
  provider: ApiProviderId;
  settings: ApiProviderSettings;
  stats: ProviderStats | null;
  stored: StoredApiKey[];
  storedBalances?: KeyBalanceResult[];
  env: string[];
  envBalances?: KeyBalanceResult[];
  envHint: React.ReactNode;
  balanceNote: string;
}) {
  const label = PROVIDER_LABELS[provider];
  const hasKeys = stored.length + env.length > 0;
  const lastFailed =
    !!stats?.lastErrorAt && (!stats.lastSuccessAt || stats.lastErrorAt > stats.lastSuccessAt);
  const status = !hasKeys
    ? "Not configured"
    : !settings.enabled[provider]
      ? "Disabled"
      : lastFailed
        ? "Degraded (last request failed)"
        : "Active";
  const when = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString() : "never");

  return (
    <section className="mt-10 border-t border-border pt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight">
          {label} <span className="ml-1 text-xs font-semibold text-accent">{roleOf(settings, provider)}</span>
        </h2>
        <form action="/admin/api-management/test" method="POST">
          <input type="hidden" name="provider" value={provider} />
          <button
            type="submit"
            className="rounded-xl border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-muted"
          >
            Test connection
          </button>
        </form>
      </div>
      <p className="mt-1 text-xs text-foreground/50">{balanceNote}</p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-border bg-surface p-4 text-xs sm:grid-cols-3">
        <Stat label="Status" value={status} />
        <Stat label="Last request" value={when(stats?.lastRequestAt)} />
        <Stat label="Last success" value={when(stats?.lastSuccessAt)} />
        <Stat
          label="Requests (ok / failed)"
          value={stats ? `${stats.requests} (${stats.successes} / ${stats.failures})` : "n/a"}
        />
        <Stat
          label="Fallback attempts / recoveries"
          value={stats ? `${stats.fallbackAttempts} / ${stats.fallbackRecoveries}` : "n/a"}
        />
        {provider === "scrapecreators" && (
          <>
            <Stat
              label="Credits remaining"
              value={stats?.creditsRemaining != null ? stats.creditsRemaining.toLocaleString() : "unknown"}
            />
            <Stat
              label="Credits consumed"
              value={stats?.creditsCharged != null ? stats.creditsCharged.toLocaleString() : "unknown"}
            />
          </>
        )}
        <Stat
          label="Last error"
          value={stats?.lastError ? `${stats.lastError} (${when(stats.lastErrorAt)})` : "none"}
        />
      </dl>
      {!stats && (
        <p className="mt-1 text-xs text-foreground/40">
          Usage statistics need Redis, which isn&apos;t configured.
        </p>
      )}

      <div className="mt-5 rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-foreground/80">Add a key</h3>
        <form action="/admin/api-management/keys" method="POST" className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input type="hidden" name="intent" value="add" />
          <input type="hidden" name="provider" value={provider} />
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
            placeholder={`${label} API key`}
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
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground/80">Dashboard-managed keys ({stored.length})</h3>
        {stored.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/50">
            No keys added here yet — {label} is running on whatever is below under &quot;Environment-variable
            keys&quot;, if any.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {stored.map((k, i) => (
              <KeyCard key={k.id} provider={provider} index={i + 1} entry={k} balance={storedBalances?.[i]} />
            ))}
          </ul>
        )}
      </div>

      {env.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-foreground/80">Environment-variable keys ({env.length})</h3>
          <p className="mt-1 text-xs text-foreground/50">{envHint}</p>
          <ul className="mt-3 space-y-2">
            {env.map((key, i) => (
              <li
                key={i}
                className="flex flex-col gap-1 rounded-xl border border-border bg-surface-muted px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <code className="text-sm text-foreground/80">{maskKey(key)}</code>
                {envBalances?.[i] && (
                  <span className={`text-xs ${balanceTone(envBalances[i])}`}>{formatBalance(envBalances[i])}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-foreground/40">{label}</dt>
      <dd className="text-foreground/80">{value}</dd>
    </div>
  );
}

function KeyCard({
  provider,
  index,
  entry,
  balance,
}: {
  provider: ApiProviderId;
  index: number;
  entry: StoredApiKey;
  balance?: KeyBalanceResult;
}) {
  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-foreground/40">#{index}</span>{" "}
          <span className="text-sm font-semibold">{entry.label}</span>
          <code className="ml-2 text-xs text-foreground/50">{maskKey(entry.key)}</code>
        </div>
        {balance && <span className={`text-xs ${balanceTone(balance)}`}>{formatBalance(balance)}</span>}
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-medium text-accent">Replace this key</summary>
        <form action="/admin/api-management/keys" method="POST" className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="intent" value="replace" />
          <input type="hidden" name="provider" value={provider} />
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

      <form action="/admin/api-management/keys" method="POST" className="mt-2">
        <input type="hidden" name="intent" value="remove" />
        <input type="hidden" name="provider" value={provider} />
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
      <h1 className="text-xl font-bold tracking-tight">API Management</h1>
      <p className="mt-1 text-sm text-foreground/60">Sign in to manage API providers, keys and usage.</p>
      <form action="/admin/api-management/login" method="POST" className="mt-6 flex flex-col gap-3">
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
