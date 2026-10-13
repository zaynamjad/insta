import { describe, expect, it, vi } from "vitest";
import { RoutedStoryProvider, type RoutingSnapshot } from "../provider-router";
import { ProviderError, type StoryProvider } from "../provider";
import { DEFAULT_PROVIDER_SETTINGS, type ApiProviderSettings } from "../provider-settings";
import type { ProviderAttemptRecord } from "../provider-stats";
import type { Profile } from "@/types/profile";

vi.mock("../provider-stats", () => ({ recordAttempt: vi.fn(async () => {}) }));

const profile = (username: string): Profile => ({
  username,
  profileImage: null,
  profileImageHd: null,
  fullName: null,
  bio: null,
  followers: 0, // zero is a real count, distinct from null
  following: null,
  posts: null,
  isVerified: false,
  isPublic: true,
  stories: [],
  category: null,
  externalUrl: null,
});

function client(over: Partial<StoryProvider> = {}): StoryProvider {
  return {
    getProfile: vi.fn(async (u: string) => profile(u)),
    getBasicProfile: vi.fn(async (u: string) => profile(u)),
    getPosts: vi.fn(async () => []),
    getPostByShortcode: vi.fn(async () => null),
    getHighlights: vi.fn(async () => []),
    getHighlightItems: vi.fn(async () => null),
    ...over,
  };
}

function setup(
  hiker: StoryProvider,
  sc: StoryProvider,
  over: Partial<ApiProviderSettings> = {},
  configured = { hikerapi: true, scrapecreators: true },
) {
  const records: ProviderAttemptRecord[] = [];
  const snapshot: RoutingSnapshot = {
    settings: { ...DEFAULT_PROVIDER_SETTINGS, primary: "hikerapi", enabled: { ...DEFAULT_PROVIDER_SETTINGS.enabled }, ...over },
    configured,
  };
  const router = new RoutedStoryProvider(snapshot, { hikerapi: hiker, scrapecreators: sc }, async (r) => {
    records.push(r);
  });
  return { router, records };
}

const timeout = () => new ProviderError("timed out", "UPSTREAM_TIMEOUT", undefined, true);
const rateLimited = () => new ProviderError("429", "RATE_LIMITED", undefined, true);
const server5xx = () => new ProviderError("5xx", "UPSTREAM_ERROR", undefined, true);

describe("RoutedStoryProvider — Test A (HikerAPI primary → Scrape Creators fallback)", () => {
  it("does not call Scrape Creators when HikerAPI succeeds", async () => {
    const hiker = client();
    const sc = client();
    const { router, records } = setup(hiker, sc);
    expect((await router.getBasicProfile("alice"))?.username).toBe("alice");
    expect(sc.getBasicProfile).not.toHaveBeenCalled();
    expect(records).toMatchObject([{ provider: "hikerapi", ok: true, isFallback: false }]);
  });

  it.each([
    ["timeout", timeout],
    ["429", rateLimited],
    ["5xx", server5xx],
  ])("falls back to Scrape Creators on %s", async (_n, make) => {
    const hiker = client({ getPosts: vi.fn(async () => { throw make(); }) });
    const sc = client({ getPosts: vi.fn(async () => []) });
    const { router, records } = setup(hiker, sc);
    await expect(router.getPosts("alice")).resolves.toEqual([]);
    expect(sc.getPosts).toHaveBeenCalledTimes(1);
    expect(records.map((r) => [r.provider, r.ok, r.isFallback])).toEqual([
      ["hikerapi", false, false],
      ["scrapecreators", true, true],
    ]);
  });

  it("does not fall back on a non-retryable error", async () => {
    const hiker = client({ getPosts: vi.fn(async () => { throw new ProviderError("Invalid username.", "UPSTREAM_ERROR"); }) });
    const sc = client();
    const { router } = setup(hiker, sc);
    await expect(router.getPosts("alice")).rejects.toThrow("Invalid username.");
    expect(sc.getPosts).not.toHaveBeenCalled();
  });

  it("does not fall back when the answer is 'not found' (null)", async () => {
    const hiker = client({ getBasicProfile: vi.fn(async () => null) });
    const sc = client();
    const { router } = setup(hiker, sc);
    await expect(router.getBasicProfile("ghost")).resolves.toBeNull();
    expect(sc.getBasicProfile).not.toHaveBeenCalled();
  });

  it("throws the last error, once each, when both providers fail", async () => {
    const hiker = client({ getPosts: vi.fn(async () => { throw timeout(); }) });
    const sc = client({ getPosts: vi.fn(async () => { throw rateLimited(); }) });
    const { router } = setup(hiker, sc);
    await expect(router.getPosts("alice")).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(hiker.getPosts).toHaveBeenCalledTimes(1);
    expect(sc.getPosts).toHaveBeenCalledTimes(1);
  });

  it("keeps HikerAPI-only behavior when Scrape Creators is disabled or has no key", async () => {
    for (const [over, configured] of [
      [{ enabled: { hikerapi: true, scrapecreators: false } }, { hikerapi: true, scrapecreators: true }],
      [{}, { hikerapi: true, scrapecreators: false }],
    ] as const) {
      const hiker = client({ getPosts: vi.fn(async () => { throw timeout(); }) });
      const sc = client();
      const { router } = setup(hiker, sc, over, configured);
      await expect(router.getPosts("alice")).rejects.toMatchObject({ code: "UPSTREAM_TIMEOUT" });
      expect(sc.getPosts).not.toHaveBeenCalled();
    }
  });

  it("does not fall back when failover is switched off", async () => {
    const hiker = client({ getPosts: vi.fn(async () => { throw timeout(); }) });
    const sc = client();
    const { router } = setup(hiker, sc, { fallbackEnabled: false });
    await expect(router.getPosts("alice")).rejects.toThrow();
    expect(sc.getPosts).not.toHaveBeenCalled();
  });
});

describe("RoutedStoryProvider — Test B (Scrape Creators primary → HikerAPI fallback)", () => {
  it("uses Scrape Creators first and does not touch HikerAPI on success", async () => {
    const hiker = client();
    const sc = client();
    const { router } = setup(hiker, sc, { primary: "scrapecreators" });
    await router.getPosts("alice");
    expect(sc.getPosts).toHaveBeenCalledTimes(1);
    expect(hiker.getPosts).not.toHaveBeenCalled();
  });

  it("falls back to HikerAPI when Scrape Creators fails retryably", async () => {
    const hiker = client();
    const sc = client({ getHighlights: vi.fn(async () => { throw server5xx(); }) });
    const { router, records } = setup(hiker, sc, { primary: "scrapecreators" });
    await router.getHighlights("alice");
    expect(hiker.getHighlights).toHaveBeenCalledTimes(1);
    expect(records.at(-1)).toMatchObject({ provider: "hikerapi", isFallback: true, ok: true });
  });

  it("sends Stories lookups (getProfile) to HikerAPI even when failover is off", async () => {
    const hiker = client();
    const sc = client();
    const { router } = setup(hiker, sc, { primary: "scrapecreators", fallbackEnabled: false });
    await router.getProfile("alice");
    expect(hiker.getProfile).toHaveBeenCalledTimes(1);
    expect(sc.getProfile).not.toHaveBeenCalled();
  });

  it("reports an unsupported operation when only Scrape Creators is usable", async () => {
    const { router } = setup(client(), client(), {
      primary: "scrapecreators",
      enabled: { hikerapi: false, scrapecreators: true },
    });
    await expect(router.getProfile("alice")).rejects.toMatchObject({ code: "CONTENT_UNAVAILABLE" });
  });
});

describe("RoutedStoryProvider — default (Scrape Creators for data, HikerAPI for Stories)", () => {
  const route = (hiker: StoryProvider, sc: StoryProvider) =>
    new RoutedStoryProvider(
      { settings: DEFAULT_PROVIDER_SETTINGS, configured: { hikerapi: true, scrapecreators: true } },
      { hikerapi: hiker, scrapecreators: sc },
      async () => {},
    );

  it("uses HikerAPI for Stories and Scrape Creators for everything else", async () => {
    const hiker = client();
    const sc = client();
    const r = route(hiker, sc);
    await r.getProfile("alice");
    await r.getPosts("alice");
    expect(hiker.getProfile).toHaveBeenCalledTimes(1);
    expect(sc.getPosts).toHaveBeenCalledTimes(1);
    expect(hiker.getPosts).not.toHaveBeenCalled();
  });

  it("falls back to HikerAPI when Scrape Creators errors", async () => {
    const hiker = client();
    const sc = client({ getPosts: vi.fn(async () => { throw server5xx(); }) });
    await route(hiker, sc).getPosts("alice");
    expect(hiker.getPosts).toHaveBeenCalledTimes(1);
  });
});

describe("RoutedStoryProvider — concurrency and consistency", () => {
  it("shares one upstream call between simultaneous identical requests", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const hiker = client({ getPosts: vi.fn(async () => { await gate; return []; }) });
    const { router } = setup(hiker, client());
    const a = router.getPosts("alice");
    const b = router.getPosts("alice");
    release();
    await Promise.all([a, b]);
    expect(hiker.getPosts).toHaveBeenCalledTimes(1);
  });

  it("does not merge different arguments", async () => {
    const hiker = client();
    const { router } = setup(hiker, client());
    await Promise.all([router.getPosts("alice"), router.getPosts("bob")]);
    expect(hiker.getPosts).toHaveBeenCalledTimes(2);
  });

  it("keeps the configuration it was created with, even if settings change afterwards", async () => {
    const hiker = client();
    const sc = client();
    const snapshotSettings: ApiProviderSettings = { ...DEFAULT_PROVIDER_SETTINGS, primary: "hikerapi", enabled: { ...DEFAULT_PROVIDER_SETTINGS.enabled } };
    const router = new RoutedStoryProvider(
      { settings: snapshotSettings, configured: { hikerapi: true, scrapecreators: true } },
      { hikerapi: hiker, scrapecreators: sc },
      async () => {},
    );
    const fresh = new RoutedStoryProvider(
      { settings: { ...snapshotSettings, primary: "scrapecreators" }, configured: { hikerapi: true, scrapecreators: true } },
      { hikerapi: hiker, scrapecreators: sc },
      async () => {},
    );
    await router.getPosts("alice");
    expect(hiker.getPosts).toHaveBeenCalledTimes(1);
    await fresh.getPosts("bob");
    expect(sc.getPosts).toHaveBeenCalledTimes(1);
  });
});
