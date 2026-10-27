import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getHybridConfig, getInstaloaderStatus } from "../hybrid-config";
import { InstaloaderStoryProvider } from "../instaloader-provider";
import { boundTtlByMedia, mediaUrlExpiry } from "../lookup-support";

vi.mock("@/lib/redis", () => ({ getRedisClient: () => null }));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("environment configuration", () => {
  it("is disabled by default, so nothing changes until it is switched on", () => {
    expect(getInstaloaderStatus({})).toEqual({ state: "disabled" });
    expect(getInstaloaderStatus({ INSTALOADER_ENABLED: "false", INSTALOADER_SECRET: "s" })).toEqual({ state: "disabled" });
  });

  it("gives a clear error when enabled without a secret", () => {
    expect(getInstaloaderStatus({ INSTALOADER_ENABLED: "true", INSTALOADER_URL: "https://x.test/api/ig_fetch" })).toEqual({
      state: "misconfigured",
      problem: "INSTALOADER_SECRET is required when INSTALOADER_ENABLED=true.",
    });
  });

  it("gives a clear error when enabled with no way to reach the function", () => {
    expect(getInstaloaderStatus({ INSTALOADER_ENABLED: "true", INSTALOADER_SECRET: "s" })).toMatchObject({
      state: "misconfigured",
      problem: expect.stringContaining("INSTALOADER_URL"),
    });
  });

  it("refuses a non-https function URL, except localhost for development (SSRF guard)", () => {
    const base = { INSTALOADER_ENABLED: "true", INSTALOADER_SECRET: "s" };
    expect(getInstaloaderStatus({ ...base, INSTALOADER_URL: "http://evil.test/x" })).toMatchObject({ state: "misconfigured" });
    expect(getInstaloaderStatus({ ...base, INSTALOADER_URL: "http://localhost:3000/api/ig_fetch" })).toMatchObject({ state: "ready" });
  });

  it("derives the function URL from the Vercel production domain, with the trailing slash the app requires", () => {
    const status = getInstaloaderStatus({ INSTALOADER_ENABLED: "true", INSTALOADER_SECRET: "s", VERCEL_PROJECT_PRODUCTION_URL: "example.com" });
    expect(status).toMatchObject({ state: "ready", url: "https://example.com/api/ig_fetch/", timeoutMs: 5000 });
  });

  it("ignores nonsense numbers and keeps the documented defaults", () => {
    const cfg = getHybridConfig({ CACHE_TTL_PROFILE_S: "abc", CACHE_TTL_STORIES_S: "-5", INSTALOADER_TIMEOUT_MS: "0" });
    expect(cfg.ttl).toEqual({ profileS: 21600, shortS: 600, postsS: 1800, storiesS: 120, highlightsS: 21600, mediaS: 3600, negativeS: 30 });
  });

  it("honours configured TTLs and limits", () => {
    const cfg = getHybridConfig({ CACHE_TTL_STORIES_S: "45", HIKERAPI_MAX_CALLS_PER_REQUEST: "2", HIKERAPI_MONTHLY_UNIT_LIMIT: "1000", BREAKER_OPEN_S: "60" });
    expect(cfg.ttl.storiesS).toBe(45);
    expect(cfg.hiker).toEqual({ maxCallsPerRequest: 2, monthlyUnitLimit: 1000 });
    expect(cfg.breaker.openForS).toBe(60);
  });
});

describe("InstaloaderStoryProvider", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const ready = () => ({ state: "ready" as const, url: "https://example.com/api/ig_fetch/", secret: "shh", timeoutMs: 3000 });
  const il = new InstaloaderStoryProvider(ready);
  const igProfile = { user_id: 123, username: "alice", full_name: "Alice", biography: "", profile_pic_url: "https://x/a.jpg", followers: 0, following: -1, posts: 4, is_private: false, is_verified: true, category: null, external_url: "" };

  it("maps a profile, keeping zero and unavailable counts distinct, and carries the user id", async () => {
    fetchMock.mockResolvedValueOnce(json({ ok: true, data: { profile: igProfile } }));
    expect(await il.getBasicProfile("Alice")).toMatchObject({
      username: "alice",
      followers: 0,
      following: null,
      posts: 4,
      bio: null,
      isPublic: true,
      isVerified: true,
      userId: "123",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.com/api/ig_fetch/");
    expect(init.headers["x-instaloader-secret"]).toBe("shh");
    expect(JSON.parse(init.body)).toEqual({ feature: "profile", username: "alice", limit: 12 });
  });

  it("maps posts and flags reels; drops posts without media", async () => {
    fetchMock.mockResolvedValueOnce(
      json({
        ok: true,
        data: {
          profile: igProfile,
          posts: [
            { id: 1, shortcode: "AAA", caption: "c", timestamp: "2026-01-01T00:00:00Z", likes: -1, comments: 2, is_reel: true, items: [{ type: "video", url: "https://x/v.mp4", thumbnail: "https://x/t.jpg" }] },
            { id: 2, shortcode: "BBB", items: [] },
          ],
        },
      }),
    );
    const posts = await il.getPosts("alice");
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ id: "1", isReel: true, likeCount: null, commentCount: 2, items: [{ type: "video", mediaUrl: "https://x/v.mp4", thumbnailUrl: "https://x/t.jpg" }] });
  });

  it("a confirmed not_found is a definitive null / empty answer", async () => {
    fetchMock.mockImplementation(async () => json({ ok: false, error: { category: "not_found" } }, 404));
    expect(await il.getBasicProfile("ghost")).toBeNull();
    expect(await il.getPosts("ghost")).toEqual([]);
  });

  it.each(["rate_limited", "login_required", "upstream_error", "timeout", "unsupported", "disabled", "unauthorized"])(
    "%s is retryable so the router can fall back",
    async (category) => {
      fetchMock.mockResolvedValueOnce(json({ ok: false, error: { category } }, 502));
      await expect(il.getBasicProfile("alice")).rejects.toMatchObject({ retryable: true });
    },
  );

  it("malformed or non-JSON answers are errors, never an empty profile", async () => {
    fetchMock.mockResolvedValueOnce(json({ ok: true, data: {} }));
    await expect(il.getBasicProfile("alice")).rejects.toMatchObject({ retryable: true });
    fetchMock.mockResolvedValueOnce(new Response("<html>login</html>", { status: 200 }));
    await expect(il.getBasicProfile("alice")).rejects.toMatchObject({ retryable: true });
  });

  it("network failures and timeouts are retryable", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(il.getBasicProfile("alice")).rejects.toMatchObject({ retryable: true, code: "UPSTREAM_ERROR" });
    fetchMock.mockRejectedValueOnce(Object.assign(new Error("aborted"), { name: "AbortError" }));
    await expect(il.getBasicProfile("alice")).rejects.toMatchObject({ retryable: true, code: "UPSTREAM_TIMEOUT" });
  });

  it("rejects invalid usernames before any request, and invalid_input is not retryable", async () => {
    await expect(il.getBasicProfile("not valid!!")).rejects.toMatchObject({ retryable: false });
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(json({ ok: false, error: { category: "invalid_input" } }, 400));
    await expect(il.getBasicProfile("alice")).rejects.toMatchObject({ retryable: false });
  });

  it("reports a clear configuration error when misconfigured, and makes no request", async () => {
    const bad = new InstaloaderStoryProvider(() => ({ state: "misconfigured", problem: "INSTALOADER_SECRET is required when INSTALOADER_ENABLED=true." }));
    await expect(bad.getBasicProfile("alice")).rejects.toMatchObject({ message: expect.stringContaining("INSTALOADER_SECRET is required") });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not offer Stories", async () => {
    await expect(il.getProfile()).rejects.toMatchObject({ code: "CONTENT_UNAVAILABLE" });
    expect((il as { getStories?: unknown }).getStories).toBeUndefined();
    expect((il as { getHighlights?: unknown }).getHighlights).toBeUndefined();
  });
});

describe("media URL expiry", () => {
  const url = (oe: number) => `https://scontent.cdninstagram.com/v/x.jpg?oe=${oe.toString(16).toUpperCase()}&sig=1`;
  const now = Date.UTC(2026, 0, 1);

  it("reads Instagram's oe= expiry", () => {
    expect(mediaUrlExpiry(url(1_800_000_000))).toBe(1_800_000_000);
    expect(mediaUrlExpiry("https://x/a.jpg")).toBeNull();
    expect(mediaUrlExpiry("not a url")).toBeNull();
  });

  it("never caches longer than the media stays valid (minus a safety margin)", () => {
    const expiresIn = (s: number) => url(now / 1000 + s);
    expect(boundTtlByMedia(21600, [expiresIn(3600)], now)).toBe(3600 - 300);
    expect(boundTtlByMedia(120, [expiresIn(3600)], now)).toBe(120);
    expect(boundTtlByMedia(21600, [expiresIn(3600), expiresIn(900)], now)).toBe(900 - 300);
  });

  it("does not cache media that is about to expire or already has", () => {
    expect(boundTtlByMedia(120, [url(now / 1000 + 200)], now)).toBe(0);
    expect(boundTtlByMedia(120, [url(now / 1000 - 10)], now)).toBe(0);
  });

  it("leaves TTLs alone when there is no expiry information", () => {
    expect(boundTtlByMedia(21600, ["https://x/a.jpg", null, undefined], now)).toBe(21600);
  });
});
