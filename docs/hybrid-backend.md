# Hybrid backend: shared cache, Instaloader tier, HikerAPI credit controls

This describes what the backend does between a visitor's search and a paid
provider call, why it is built that way, and — importantly — what was
**measured** versus **assumed**. Nothing here claims a credit saving that has
not been measured; see [Verifying that usage decreased](#verifying-that-hikerapi-usage-decreased).

## Architecture

```
search / tab open
  → input validation + username normalization   (validation.ts)
  → visitor rate limit                          (route handlers, unchanged)
  → shared cache lookup (Redis)                 (shared-cache.ts, lookup-support.ts)
  → request deduplication (Redis lock)          (shared-cache.ts)
  → feature-specific provider router            (provider-router.ts)
       → Instaloader (profile, posts) — only when enabled and its circuit is closed
       → HikerAPI / Scrape Creators per the admin Primary/Fallback settings
  → normalization into the existing response schema
  → cache successful results only               (TTL per feature)
  → existing frontend-compatible JSON
```

Everything lives inside the existing Next.js/Vercel project. The one new
runtime is a small **Python Vercel Function** (`api/ig_fetch.py`); there is no
external worker.

## Files

Created:
- `api/ig_fetch.py` — Instaloader as a Vercel Python Function (profile + first page of posts).
- `requirements.txt` — `instaloader==4.15.5`.
- `vercel.json` — function limits for `api/ig_fetch.py`.
- `src/lib/story/hybrid-config.ts` — environment configuration with defaults and clear errors.
- `src/lib/story/shared-cache.ts` — Redis cache-aside, locks, request de-duplication.
- `src/lib/story/lookup-support.ts` — TTL rules, media-URL expiry, shared profile entry.
- `src/lib/story/instaloader-provider.ts` — client for the Python function.
- `src/lib/story/circuit-breaker.ts` — Redis-backed per-provider circuit breaker.
- `src/lib/story/call-budget.ts` — per-visitor-request cap on paid HTTP calls.
- `src/lib/story/usage.ts` — HikerAPI billable-unit metering, monthly thresholds, cache hit/miss metrics.
- Tests: `shared-cache`, `hybrid-router`, `lookup`, `hikerapi-provider`, `instaloader` (+ `fake-redis.ts` helper).

Modified:
- `provider-router.ts` (Instaloader tier, `getStories`, circuit breaker, fallback reasons),
  `provider.ts` (optional `getStories`, `RequestHints`), `index.ts` (per-request clients and budget),
  `hikerapi-provider.ts` (budget, metering, `getStories` by id, failures no longer become empty lists),
  `scrapecreators-provider.ts` (passes through the numeric user id when present),
  `lookup.ts`, `posts-lookup.ts`, `highlights-lookup.ts`, `post-lookup.ts`, `highlight-lookup.ts` (shared cache),
  `provider-stats.ts` / `provider-settings.ts` (log record fields, labels), `types/profile.ts` (internal `userId`),
  the admin page (usage and status section).
- Removed: `cache.ts` (per-instance in-memory cache; superseded by `shared-cache.ts`).

## Routing rules

| Feature | Cache | Provider order |
|---|---|---|
| Profile metadata + picture | `profile:v1:<user>`, 6 h | Instaloader (if enabled) → admin Primary → Fallback |
| Active Stories | `stories:v1:<user>`, 2 min | **HikerAPI only** (Scrape Creators has no Stories endpoint; Instaloader cannot do them anonymously). Fetched by user id when known. |
| Posts, Photos, Videos, Reels | `posts:v1:<user>`, 30 min | Instaloader (if enabled) → admin Primary → Fallback. One list; the UI filters by `isReel`. |
| Highlights tray | `highlights:v1:<user>`, 6 h | Admin Primary → Fallback (Instaloader cannot do these anonymously) |
| One highlight / one post by URL | `…:v1:<id>`, 1 h | Admin Primary → Fallback |
| "Not found" | 30 s | — |
| Private profile, empty lists | 10 min | — |

Rules applied to every request:
- A cached answer is returned without any provider call.
- Instaloader is tried only for what it can serve, only when enabled and configured, and only while its circuit is closed.
- Invalid usernames are rejected before the cache or any provider is touched. A non-retryable provider error (invalid input, bad credentials) never triggers a fallback. A confirmed "no such profile" is a definitive answer and is not second-guessed with a paid call.
- After an Instaloader failure there is **one** paid call (plus the existing admin Fallback only if that paid call itself fails retryably). No loops.
- Failures, timeouts, rate limits and malformed answers are never cached. A non-OK answer from HikerAPI's posts/highlights endpoints is an error, not an empty list.

## Cache and de-duplication

- Redis via the existing `@upstash/redis` client (`UPSTASH_REDIS_REST_*` or the Marketplace's `KV_REST_API_*`).
- On a miss one request takes a 20 s lock (`SET NX EX`), re-checks the cache, loads, stores, and releases the lock (only if it is still the owner). Concurrent identical requests wait up to 10 s for that result instead of calling upstream; if it never appears they load themselves.
- Same-instance requests also share one in-flight promise.
- Cached lifetimes are shortened to stay inside the signed-URL expiry (`oe=` query parameter) of the media inside them, minus 5 minutes; data whose media is about to expire is not cached.
- Without Redis the cache falls back to **per-process memory**. That is not shared across invocations, a warning is logged once in production, and the admin page shows "per-instance only". Nothing pretends otherwise.
- Only public profile data is cached; no credentials, cookies or visitor data.

## HikerAPI credit accounting

Billable units come from HikerAPI's own OpenAPI notes and are recorded per
endpoint in Redis (`api-usage:hikerapi:<YYYY-MM>`; query strings, so
usernames, are stripped):

| Endpoint | Units |
|---|---|
| `/v2/user/by/username` | 1 |
| `/v2/user/stories`, `/v1/user/stories` | **2** |
| `/v1/user/highlights`, `/v2/user/highlights` | **2** |
| `/v2/user/stories/by/username`, `…/highlights/by/username` | **3** (not used; the by-id forms are cheaper) |
| `/v1/user/medias/chunk`, `/v1/highlight/by/url`, `/v1/media/by/code` | not stated; counted as 1 and labelled "price assumed" |

HikerAPI bills any successful response (including 400/403/404) and not 5xx;
429 and no-response are treated as unbilled. `HIKERAPI_MONTHLY_UNIT_LIMIT`
enables 80 % / 100 % threshold alerts (a `console.warn` once per month per
threshold, and shown in the admin page). `HIKERAPI_MAX_CALLS_PER_REQUEST`
(default 4) caps HTTP calls one visitor request can make, key rotation
included.

Each attempt's record (admin "Recent requests", Redis) holds timestamp, feature
(operation), provider, success, fallback flag and reason, duration and a
short error class. Cache hits/misses per feature are counted separately.
Secrets, headers and payloads are never logged.

Expected effect on HikerAPI units (before → after, **calculated, not measured**):

| Action | Before | After |
|---|---|---|
| Search, cold | 3 (profile 1 + stories 2) | 2 if a profile source supplied the user id (Instaloader, or Scrape Creators when its response includes `id`); otherwise 3 |
| Search, profile warm (≤ 6 h) | 3 | 2; **0** if stories also cached (≤ 2 min) |
| Posts tab | 2 (user 1 + list 1) | 1 with id; **0** with Instaloader or when the profile reports 0 posts |
| Highlights tray | 3 | 2 with id |
| Repeat of any of the above on another instance | repeated | **0** (shared cache) |

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` (or `KV_REST_API_URL` / `_TOKEN`) | — | Shared cache, locks, breaker, metrics. Already used by the app. |
| `INSTALOADER_ENABLED` | off | `true` turns the Instaloader tier on. |
| `INSTALOADER_SECRET` | — | Required when enabled. Shared secret between the app and the Python function (`x-instaloader-secret`). Set the same value for both. |
| `INSTALOADER_URL` | `https://$VERCEL_PROJECT_PRODUCTION_URL/api/ig_fetch/` | Only needed outside Vercel. Must be https (localhost may use http). |
| `INSTALOADER_TIMEOUT_MS` | 5000 | Per-request timeout, both in the client and inside the function. |
| `CACHE_TTL_PROFILE_S` / `_STORIES_S` / `_POSTS_S` / `_HIGHLIGHTS_S` / `_MEDIA_S` / `_NEGATIVE_S` / `_SHORT_S` | 21600 / 120 / 1800 / 21600 / 3600 / 30 / 600 | Cache lifetimes in seconds. |
| `HIKERAPI_MAX_CALLS_PER_REQUEST` | 4 | Paid HTTP calls per visitor request. |
| `HIKERAPI_MONTHLY_UNIT_LIMIT` | 0 (off) | Estimated billable units per month, for alerts. |
| `BREAKER_FAILURE_THRESHOLD` / `_FAILURE_WINDOW_S` / `_OPEN_S` | 3 / 60 / 300 | Circuit breaker. |

HikerAPI keys remain managed in the admin panel (`/admin/api-management`);
this change does not read a `HIKER_API_KEY` environment variable. Enabled but
misconfigured Instaloader is skipped (logged once, shown in the admin page);
it never breaks a request.

## Python runtime

`api/ig_fetch.py` is a plain `BaseHTTPRequestHandler` Vercel Function. Vercel
installs `requirements.txt` (`instaloader==4.15.5`) and ran it on its default
Python runtime when deployed (pin a version with `.python-version` or
`pyproject.toml` if you need one). `vercel.json` sets `maxDuration` to 15 s.
The file is named `ig_fetch.py` — not `instaloader.py` — because a module with
that name would shadow the package it imports. Because the app uses
`trailingSlash: true`, the function is called at `/api/ig_fetch/`.

Safety properties: it requires the shared secret; accepts only `profile` and
`posts`; validates the username; makes no retries (`max_connection_attempts=1`)
and never sleeps out a rate limit (a custom `RateController` raises instead);
uses no login/session/cookies and writes no files; returns only a category
(`rate_limited`, `login_required`, `not_found`, `timeout`, …), never stack
traces; and fetches only the first page (≤ 12 posts).

## Measured results and known limitations

Measured on 2026-10-27 from a real Vercel preview deployment (and once from
a residential IP as a control):

- The Python function builds, deploys and authenticates correctly; bad secret → 401, unsupported feature → 422.
- **Anonymous `Profile.from_username` failed from Vercel's network** for both public profiles tried (`nasa`, `instagram`): Instagram returned a body that was not JSON (a login wall), surfaced as `upstream_error`.
- The control request from a residential IP got **HTTP 429**.
- This agrees with `docs/story-retrieval-limitations.md`: anonymous Instagram access degrades within a few requests. **Instaloader is therefore disabled by default** and must not be assumed to work. If you enable it, the circuit breaker stops it after three consecutive failures for five minutes, so a blocked Instaloader costs a short delay, not repeated waits, and every failed request still gets its answer from the paid providers.
- **Stories and Highlights are not available anonymously** through Instaloader (login required) and are not attempted. Do not add a login/session to work around this.
- No live end-to-end search through the app was run: the public search endpoint requires a reCAPTCHA token and the provider keys live in the admin panel. The provider, router, cache, metering and lookup logic are covered by mocked tests only.
- `/v1/user/medias/chunk` is marked deprecated by HikerAPI and may 404 for accounts that have posts; that is now an error (and a fallback trigger) instead of a cached empty list. Moving to `/g2/user/medias` needs a live key to verify and was not done.
- Whether Scrape Creators' profile response includes the numeric `id` is unverified; without it the Stories step still works but costs the old 3 units.
- Circuit-breaker recovery is time-based (no single half-open probe): after the open period a fresh run of failures is needed to re-open it.

## Deploying

1. Make sure Redis is provisioned (it already is for this project).
2. Deploy as usual (`vercel deploy` / git push). `requirements.txt` and `vercel.json` are picked up automatically; with none of the new variables set, behavior is the existing providers plus the shared cache.
3. To try Instaloader: set `INSTALOADER_SECRET` (e.g. `openssl rand -hex 24`) and `INSTALOADER_ENABLED=true` in Vercel → Settings → Environment Variables, redeploy, and watch the admin page. Turn it off again if the request log shows it failing — it costs nothing to leave off.
4. Optionally set `HIKERAPI_MONTHLY_UNIT_LIMIT` to match your plan.

## Verifying that HikerAPI usage decreased

1. Before deploying, note HikerAPI's balance (`/sys/balance` is free; the admin page shows it) and the admin month-to-date units.
2. After deploying, run a fixed script against the live site: 10 distinct, never-searched public usernames, one search each (Stories tab only). Expect about 20 units with the id available (30 without) on HikerAPI; compare with the balance delta.
3. Repeat the same 10 searches immediately: expect ~0 new units (stories cached 2 min) and, after 2 minutes, 20 (profiles still cached).
4. Open Posts and Highlights on a few profiles: expect 1 and 2 units each, not 2 and 3.
5. In the admin page confirm per-endpoint calls/units match the balance delta, that cache hit rates rise over days, and that no threshold alert fired unexpectedly.
6. Judge savings only from the HikerAPI balance/invoice over a comparable period — not from these expectations.
