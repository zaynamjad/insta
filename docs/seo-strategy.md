# SEO & Growth Strategy — StoryPeek (Instagram Story Viewer)

This document is the project's SEO reference: keyword map, competitor
analysis, URL architecture, programmatic SEO policy, content plan,
technical SEO checklist, schema plan, internal linking rules, AdSense
readiness, and a 30/60/90-day plan.

> **Note on data sources:** competitor structure below (URL patterns, page
> types, general approach) is based on how this niche of tools is
> typically built and is directionally accurate, not pulled from a live
> crawl or a paid SEO tool. Before acting on priority calls, verify current
> rankings, backlink counts, and traffic estimates with Google Search
> Console, Ahrefs/Semrush, and manual SERP checks — those numbers move
> constantly and shouldn't be hardcoded into a strategy doc.

## A. Keyword Map

| Keyword | Intent | URL | Priority |
|---|---|---|---|
| instagram story viewer | Core / navigational-commercial | `/instagram-story-viewer/` | P0 |
| instagram stories viewer | Core | `/instagram-story-viewer/` | P0 |
| insta story viewer | Core (shorthand) | `/instagram-story-viewer/` | P1 |
| instagram viewer | Core (broad) | `/instagram-story-viewer/` | P2 |
| anonymous instagram story viewer | Anonymity | `/anonymous-instagram-story-viewer/` | P0 |
| anonymous instagram viewer | Anonymity (broad) | `/anonymous-instagram-viewer/` | P1 |
| view instagram stories anonymously | Anonymity | `/anonymous-instagram-story-viewer/` | P0 |
| watch instagram stories anonymously | Anonymity | `/anonymous-instagram-story-viewer/` | P1 |
| view instagram story without being seen | Anonymity | `/anonymous-instagram-story-viewer/` | P1 |
| instagram story viewer without login | No-login | `/instagram-story-viewer-without-login/` | P0 |
| instagram story viewer no login | No-login | `/instagram-story-viewer-without-login/` | P0 |
| instagram stories without account | No-login | `/instagram-story-viewer-without-login/` | P1 |
| view instagram story without login | No-login | `/instagram-story-viewer-without-login/` | P1 |
| instagram story viewer by username | Username | `/instagram-story-viewer-by-username/` | P0 |
| instagram story viewer username | Username | `/instagram-story-viewer-by-username/` | P1 |
| view instagram story by username | Username | `/instagram-story-viewer-by-username/` | P1 |
| anonymous instagram username viewer | Username + anonymity | `/instagram-story-viewer-by-username/` | P2 |
| can you view instagram stories anonymously | Question / AEO | `/blog/how-to-view-instagram-stories-anonymously/` | P0 |
| can someone see if you view their instagram story | Question / AEO | `/blog/can-someone-see-if-you-viewed-their-instagram-story/` | P0 |
| how to view instagram stories without being seen | Question / AEO | `/blog/how-to-view-instagram-stories-anonymously/` | P1 |
| can you view instagram stories without an account | Question / AEO | `/blog/instagram-story-viewer-without-login-guide/` | P1 |
| how does anonymous instagram story viewing work | Question / AEO | `/blog/how-to-view-instagram-stories-anonymously/` | P1 |
| what is an instagram story | Educational | `/blog/what-is-an-instagram-story/` | P2 |
| how long do instagram stories last | Educational | `/blog/what-is-an-instagram-story/` | P2 |
| instagram stories vs highlights | Comparison | `/blog/instagram-stories-vs-highlights/` | P2 |

**Grouping logic:** every "tool-intent" cluster (core, anonymity, no-login,
username) maps to exactly one indexable landing page so relevance signals
aren't split across near-duplicate URLs. Every "question-intent" cluster
maps to a blog article written to answer that question directly in the
first 2-3 sentences (AEO-friendly), which then links back to the relevant
tool page.

## B. Competitor Analysis

| Competitor | Typical keyword focus | Typical strengths | Typical weaknesses | Opportunity for us |
|---|---|---|---|---|
| AnonyIG-style tools | "anonymous", "IG story viewer" | Brand recognition in-niche, simple UX | Often thin content, aggressive ad placement, weak trust signals (no real privacy policy/about page) | Win on trust: real legal pages, honest anonymity claims, cleaner ad load |
| InstaStoriesViewer-style tools | Broad head terms + some programmatic pages | Larger page count, some long-tail coverage | Templated, low-uniqueness landing pages; inconsistent metadata | Win on genuine content uniqueness per page + better Core Web Vitals |
| AnonStories-style tools | "no login", "without account" | Targets the no-login cluster directly | Often minimal explanation/FAQ content, weak internal linking | Win on AEO-structured FAQs + a real content hub linking back to the tool |

**Common gaps across this niche** (verify per-competitor with a live
crawl before prioritizing):

- **Content gap:** most competitors don't answer the "does Instagram
  notify" / "can someone see if you viewed" question cluster with a
  dedicated, well-structured page — that's a clear AEO opportunity.
- **UX gap:** many rely on heavy interstitials/redirects before showing
  results, which hurts both conversion and Core Web Vitals (INP/CLS).
- **Trust gap:** thin or missing About/Privacy/Terms pages, which caps
  AdSense approval odds and E-E-A-T.
- **Schema gap:** FAQPage/SoftwareApplication schema is inconsistently
  implemented or missing entirely on many competitor pages.

## C. URL Architecture

```text
/
/instagram-story-viewer/
/anonymous-instagram-story-viewer/
/instagram-story-viewer-without-login/
/instagram-story-viewer-by-username/
/anonymous-instagram-viewer/
/blog/
/blog/how-to-view-instagram-stories-anonymously/
/blog/instagram-story-viewer-without-login-guide/
/blog/can-someone-see-if-you-viewed-their-instagram-story/
/blog/what-is-an-instagram-story/
/blog/instagram-stories-vs-highlights/
/about/
/contact/
/privacy-policy/
/terms/
/disclaimer/
/sitemap.xml
/robots.txt
```

Rules: lowercase, hyphenated, trailing slash, no query-parameter-based
canonical content, no more than one URL per keyword cluster.

## D. Programmatic SEO Strategy

**What we generate:** the 5 intent-clustered tool landing pages above, plus
editorial blog content. Both are hand-authored (or template-assisted with
genuinely distinct content per page, as in `src/content/landing-pages.ts`)
and reviewed for uniqueness before publishing.

**What we deliberately do NOT generate:**

- Per-username result pages (`/instagram/user/<username>/`) — these would
  be either empty/thin (most lookups return "not found" or expire within
  24h) or would require caching another person's content indefinitely,
  which is both an SEO risk (thin/duplicate content, doorway pages) and a
  privacy problem.
- Keyword-swapped duplicate landing pages (e.g. a separate page per city,
  per device, or per synonym with no unique content) — Google's
  helpful-content systems specifically target this pattern.
- Any page without a genuine, unique reason to exist and be indexed.

**Future programmatic candidates** (only if genuinely useful, unique, and
maintainable): a glossary of Instagram terminology (Story, Highlight,
Reel, Close Friends, etc.) as individual definition pages with real
cross-linking, or comparison pages between this tool and manual/native
viewing — each gated behind the same "does this deserve its own indexed
URL" review used for the current 5 landing pages.

## E. Content Strategy

**Pillar:** Instagram Story Viewer (the tool itself, `/instagram-story-viewer/`).

**Clusters → supporting content:**

- **Anonymity cluster** → `/anonymous-instagram-story-viewer/`,
  `/anonymous-instagram-viewer/`, and the blog posts "How to View
  Instagram Stories Anonymously" and "Can Someone See If You Viewed Their
  Instagram Story?"
- **No-login cluster** → `/instagram-story-viewer-without-login/` and
  "Instagram Story Viewer Without Login: Full Guide"
- **Username-search cluster** → `/instagram-story-viewer-by-username/`
- **Educational cluster** (top-of-funnel, builds topical authority) →
  "What Is an Instagram Story?" and "Instagram Stories vs. Highlights"

Every article links back to at least one tool page naturally in-body (not
just in a generic footer CTA), and every tool page links to its most
relevant blog posts via "Related Searches".

## F. Technical SEO (implemented)

- Dynamic `sitemap.xml` (`src/app/sitemap.ts`) covering all indexable
  routes with per-type `changeFrequency`/`priority`.
- `robots.txt` (`src/app/robots.ts`) allowing all crawl except `/api/`.
- Canonical URL on every page via `buildMetadata()`.
- Unique title/description per page, generated through one shared
  `buildMetadata()` helper (`src/lib/seo/metadata.ts`) to prevent drift.
- Open Graph + Twitter Card metadata on every page; a generated default
  OG image (`src/app/opengraph-image.tsx`) via `next/og`.
- Semantic heading hierarchy (single H1 per page, H2s for major
  sections) enforced by the shared `LandingPage`/`BlogPostLayout`
  components.
- Custom 404 (`src/app/not-found.tsx`) that redirects intent back to the
  tool instead of dead-ending.
- No client-side-only rendering for primary content — landing pages,
  blog posts, and metadata are all server-rendered.

## G. Schema (implemented)

| Schema type | Where | Purpose |
|---|---|---|
| `WebSite` (+ `SearchAction`) | Root layout | Sitelinks search box eligibility |
| `Organization` | Root layout | Entity clarity for the brand |
| `SoftwareApplication` | Homepage + every landing page | Accurately describes the free tool (no fake ratings/pricing) |
| `BreadcrumbList` | Every non-home page (`Breadcrumbs` component) | Breadcrumb rich results |
| `FAQPage` | Every FAQ block (`Faq` component) | FAQ rich results where content genuinely is Q&A |
| `Article` | Every blog post (`BlogPostLayout`) | Article rich results, authorship/publish date clarity |

No fake reviews, ratings, or pricing are ever included, per the project's
constraints.

## H. Internal Linking

- Header nav → primary tool pages + guides hub.
- Homepage → all 5 landing pages (card grid) + FAQ.
- Every landing page → "Related Searches" linking to 3-4 sibling
  tool/blog pages using descriptive, non-repetitive anchor text.
- Every blog post → at least one in-body contextual link to a tool page
  and to at least one other relevant post, plus a closing CTA back to
  `/instagram-story-viewer/`.
- Footer → full sitemap of tools, guides, and legal pages on every page.

## I. AdSense Readiness Checklist

- [x] About page with real, specific content
- [x] Contact page with a real contact method
- [x] Privacy Policy (data collection, cookies, third-party/ad disclosure)
- [x] Terms of Service
- [x] Disclaimer (scope/limits of the tool, no password requests)
- [x] Clear primary navigation
- [x] Original content on every indexable page (no competitor copying)
- [x] Functional, genuinely useful tool (not a bait-and-switch)
- [x] No fake download buttons, fake system warnings, or deceptive UI
- [ ] Apply for AdSense once the site has live traffic and a real domain
      (do this after initial indexing, not before — thin-traffic
      applications are commonly rejected)
- [ ] Decide ad placement density up front (recommend: none above the
      search tool, none inside the story viewer modal, max 1-2 per page)

## J. 30/60/90-Day Plan

**Days 1-30 — Technical foundation + initial indexing**
- Deploy to Vercel with a real domain; set `NEXT_PUBLIC_SITE_URL`.
- Submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- Verify all 5 landing pages + 5 blog posts render correctly, pass
  Rich Results Test (FAQPage, BreadcrumbList, SoftwareApplication).
- Wire up a real, licensed Instagram data provider (`HttpInstagramProvider`).
- Run Lighthouse/PageSpeed Insights on mobile; fix any LCP/CLS/INP
  regressions before pushing more content.

**Days 31-60 — Content + internal linking depth**
- Publish 4-6 additional educational/guide articles from the content
  strategy backlog (e.g. "Instagram Story Viewer vs. Instagram App",
  "What Happens When an Instagram Story Expires?").
- Audit internal links for orphan pages; ensure every new post links to
  and from at least 2 existing pages.
- Begin light outreach/linkbuilding to relevant tech/social-media blogs
  and directories (only legitimate, editorially-earned links).
- Monitor Search Console for query data; expand the keyword map with
  real impressions data instead of assumptions.

**Days 61-90 — Scale + monetization**
- Apply for Google AdSense once organic traffic is flowing and the
  AdSense checklist above is fully green.
- Revisit programmatic SEO candidates (e.g. a terminology glossary) only
  if Search Console shows real demand for those queries.
- Move rate limiting/caching from in-memory to a shared store (Upstash
  Redis via Vercel Marketplace) once traffic approaches the
  single-instance ceiling noted in `src/lib/rate-limit.ts`.
- Re-run the full SEO health checklist (technical, on-page, AEO,
  programmatic, monetization) and address any regressions.
