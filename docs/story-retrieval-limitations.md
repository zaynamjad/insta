# Story Retrieval: What's Actually Possible, and What Isn't

This document exists because the honest answer to "can we retrieve real
Instagram Stories through public web retrieval, no login, no API, no
bypass" is **no** — and that conclusion should be visible and explained,
not buried in a code comment. Read this before touching
`src/lib/story/public-web-provider.ts` or deploying it.

## What was verified, and how

On 2026-08-25, `https://www.instagram.com/instagram/` was fetched with a
plain, unauthenticated HTTP GET (no cookies, no login, honest User-Agent).
The response (200 OK, ~848KB of HTML):

- **Does** include an embedded JSON blob (`<script type="application/json"
  data-sjs>`) with genuine public profile fields: `is_private`,
  `full_name`, `biography`, `follower_count`, `following_count`,
  `profile_pic_url`, `is_verified`. This is what powers
  `PublicWebStoryProvider`.
- **Does not** contain any Story media URL, Story identifier, or anything
  resembling Story content, anywhere in the response.

This matches how Instagram's own web client works: even logged-in
browsing fetches Story media through an authenticated API call
(historically `/api/v1/feed/reels_media/`), not through the public,
unauthenticated profile page. There is no unauthenticated surface that
exposes Story media — this isn't a parsing gap that a better scraper could
close, it's Instagram's session-authentication boundary. `getStories()`
therefore isn't implemented as "try and fail" — it's not implemented at
all, on purpose, so nobody is tempted to bend it into an auth bypass
later. `Profile.stories` is always `[]`.

## Empirical confirmation: it degrades within a couple of requests

This isn't theoretical. In the same session, a second and third plain,
unauthenticated request to the same profile URL — minutes apart, same
honest self-identifying User-Agent format Googlebot/Bingbot use
(`Mozilla/5.0 (compatible; StoryPeek/1.0; +url)`) — came back with a
smaller page (721KB vs. the first request's 848KB) that **no longer
contained the `is_private`/profile JSON blob at all**, while still
returning a plain `200 OK`. `PublicWebStoryProvider` correctly detected
this as "not enough signal to trust" and returned a clean retrieval
failure rather than guessing — but the practical takeaway is that this
degraded within single-digit requests from one IP, with no explicit
block, no 403, no 429 — just a quietly stripped-down response. Do not
read a "couldn't retrieve" result during testing as a parser bug before
checking whether this is what's happening; do not respond to it by trying
more User-Agent variations, retry loops, or other ways to look more
legitimate to Instagram's mitigation — that direction is evasion, which
this project has deliberately stayed out of throughout.

## What `PublicWebStoryProvider` actually does

Fetches `https://www.instagram.com/<username>/` exactly as any anonymous,
logged-out browser tab would, and parses:

- Open Graph tags (`og:image`, `og:title`, `og:description`) — the most
  stable part of the page, since Instagram serves these specifically for
  link-preview bots (Slack, Twitter, iMessage, etc.).
- The embedded `data-sjs` JSON blob described above, when present.

No login, no session cookie, no CAPTCHA solving, no anti-bot evasion, no
proxy rotation, no headless-browser fingerprint spoofing, no private
account access. If the page can't be parsed with confidence (especially:
if `is_private` can't be determined), the provider throws rather than
guessing — see `normalizer.ts` → `hasEnoughDataToNormalize`.

## The part that's a real, ongoing risk: robots.txt

`https://www.instagram.com/robots.txt` opens with an explicit notice:

> Collection of data on Instagram through automated means is prohibited
> unless you have express written permission from Instagram...

and its default rule is `User-agent: *` → `Disallow: /` — every automated
client not on Instagram's small named allowlist (Googlebot, Bingbot, and
a handful of recognized link-preview bots operating under Meta's specific
agreements with them) is disallowed from the entire site, profile pages
included.

`PublicWebStoryProvider` does not evade this — it identifies itself
honestly via its User-Agent string rather than spoofing a browser or an
allow-listed bot, and it doesn't fight back if Instagram blocks or
rate-limits it (see `looksLikeAccessBlocked` in `parser.ts`, which treats
a login/checkpoint wall as a retrieval failure, not a puzzle to solve).
But running this in production is still, unavoidably, automated
collection that Instagram's own policy says requires permission this
project doesn't have. Concretely, that means:

- **Blocking is likely, not hypothetical.** Expect the deployment's
  outbound IP(s) to get rate-limited or blocked at some point — this is
  Instagram actively enforcing the policy above, not a bug.
  `PublicWebStoryProvider` throws a normal `ProviderError` when that
  happens, which the UI surfaces as "We couldn't retrieve public content
  right now" — it will not attempt to route around a block.
  `checkOutboundRateLimit()` in `rate-limit.ts` caps total request volume
  specifically to reduce how often this happens.
- **Civil/ToS exposure is real, not criminal exposure.** Scraping
  technically-public, unauthenticated content is generally not a
  CFAA/"computer hacking" violation in the US (this is the throughline of
  *hiQ v. LinkedIn* and similar cases) — but it is a breach of Instagram's
  Terms of Service, and Meta has pursued civil claims against scraping
  operations before. This is a business/legal decision, not just a
  technical one — loop in counsel before relying on this in production
  at any real scale.
- **This will break without warning.** The `data-sjs` parsing in
  `parser.ts` depends on markup Instagram doesn't publish or version. It
  degrades gracefully (missing fields become `null`, not fabricated), but
  a structural change to the page can silently drop to "retrieval
  failure" for everyone until the parser is updated.

## What was deliberately not built

- No fallback to Instagram's official Graph API or any third-party
  Instagram API — excluded by the current product brief.
- No mock/demo data — removed entirely; every response reflects a real
  attempt.
- No `/profile/[username]` indexing by default (see
  `NOINDEX_PROFILE_PAGES` in `src/app/profile/[username]/page.tsx`) — an
  indexable, permanent, per-username URL mirroring scraped data is a much
  more visible artifact than an ephemeral API call, and Google penalizes
  sites built on scraped/mirrored third-party content. This is a
  conservative default beyond what was strictly asked for; revisit it as
  its own explicit decision, not a side effect of another change.
