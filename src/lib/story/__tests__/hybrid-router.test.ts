import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoutedStoryProvider, type RouteClients } from "../provider-router";
import { ProviderError, type StoryProvider } from "../provider";
import { CallBudgetError } from "../call-budget";
import { DEFAULT_PROVIDER_SETTINGS, type ApiProviderSettings } from "../provider-settings";
import type { ProviderAttemptRecord } from "../provider-stats";
import { isCircuitOpen, resetBreakersForTests } from "../circuit-breaker";
import type { Profile } from "@/types/profile";

vi.mock("../provider-stats", () => ({ recordAttempt: vi.fn(async () => {}) }));
vi.mock("@/lib/redis", () => ({ getRedisClient: () => null })); // per-process breaker state

beforeEach(() => resetBreakersForTests());

const profile = (username: string): Profile => ({
  username,
  profileImage: null,
  profileImageHd: null,
  fullName: null,
  bio: null,
  followers: 0,
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
    getStories: vi.fn(async () => []),
    getPosts: vi.fn(async () => []),
    getPostByShortcode: vi.fn(async () => null),
    getHighlights: vi.fn(async () => []),
    getHighlightItems: vi.fn(async () => null),
    ...over,
  };
}

const failing = (err: () => Error) => client({
  getBasicProfile: vi.fn(async () => { throw err(); }),
  getPosts: vi.fn(async () => { throw err(); }),
});

function setup(
  parts: { instaloader?: StoryProvider; hiker?: StoryProvider; sc?: StoryProvider },
  opts: { ready?: boolean; settings?: Partial<ApiProviderSettings> } = {},
) {
  const records: ProviderAttemptRecord[] = [];
  const hiker = parts.hiker ?? client();
  const sc = parts.sc ?? client();
  const instaloader = parts.instaloader ?? client();
  const clients: RouteClients = { hikerapi: hiker, scrapecreators: sc, instaloader };
  const router = new RoutedStoryProvider(
    {
      settings: {
        ...DEFAULT_PROVIDER_SETTINGS,
        primary: "hikerapi",
        // Failover off unless a test opts in, so "one paid call" is easy to assert.
        fallbackEnabled: false,
        enabled: { ...DEFAULT_PROVIDER_SETTINGS.enabled },
        ...opts.settings,
      },
      configured: { hikerapi: true, scrapecreators: true },
      instaloaderReady: opts.ready ?? true,
    },
    clients,
    async (r) => {
      records.push(r);
    },
  );
  return { router, records, hiker, sc, instaloader };
}

const timeout = () => new ProviderError("timed out", "UPSTREAM_TIMEOUT", undefined, true);
const rateLimited = () => new ProviderError("429", "RATE_LIMITED", undefined, true);
const blocked = () => new ProviderError("login wall", "UPSTREAM_ERROR", undefined, true);

describe("Instaloader tier: success", () => {
  it("serves profile metadata from Instaloader and never calls a paid provider", async () => {
    const { router, hiker, sc, records } = setup({});
    expect((await router.getBasicProfile("alice"))?.username).toBe("alice");
    expect(hiker.getBasicProfile).not.toHaveBeenCalled();
    expect(sc.getBasicProfile).not.toHaveBeenCalled();
    expect(records).toMatchObject([{ provider: "instaloader", ok: true, isFallback: false }]);
  });

  it("serves posts/reels from Instaloader without a paid call", async () => {
    const { router, hiker } = setup({});
    await router.getPosts("alice");
    expect(hiker.getPosts).not.toHaveBeenCalled();
  });

  it("treats a confirmed 'no such profile' as the answer and does not buy a second opinion", async () => {
    const { router, hiker } = setup({ instaloader: client({ getBasicProfile: vi.fn(async () => null) }) });
    expect(await router.getBasicProfile("ghost")).toBeNull();
    expect(hiker.getBasicProfile).not.toHaveBeenCalled();
  });
});

describe("Instaloader tier: failure → one eligible fallback", () => {
  it.each([
    ["timeout", timeout],
    ["rate limit", rateLimited],
    ["login wall / blocked", blocked],
  ])("falls back to exactly one HikerAPI call on %s", async (_name, make) => {
    const { router, hiker, sc, instaloader, records } = setup({ instaloader: failing(make) });
    expect((await router.getBasicProfile("alice"))?.username).toBe("alice");
    expect(instaloader.getBasicProfile).toHaveBeenCalledTimes(1);
    expect(hiker.getBasicProfile).toHaveBeenCalledTimes(1);
    expect(sc.getBasicProfile).not.toHaveBeenCalled();
    expect(records).toMatchObject([
      { provider: "instaloader", ok: false, isFallback: false },
      { provider: "hikerapi", ok: true, isFallback: true, fallbackReason: expect.stringContaining("instaloader") },
    ]);
  });

  it("does not fall back on invalid input, which no other provider can resolve", async () => {
    const bad = failing(() => new ProviderError("Invalid username.", "UPSTREAM_ERROR"));
    const { router, hiker } = setup({ instaloader: bad });
    await expect(router.getBasicProfile("x")).rejects.toMatchObject({ retryable: false });
    expect(hiker.getBasicProfile).not.toHaveBeenCalled();
  });

  it("is skipped entirely when Instaloader is disabled or misconfigured", async () => {
    const { router, instaloader, hiker } = setup({}, { ready: false });
    await router.getBasicProfile("alice");
    expect(instaloader.getBasicProfile).not.toHaveBeenCalled();
    expect(hiker.getBasicProfile).toHaveBeenCalledTimes(1);
  });
});

describe("features Instaloader cannot serve anonymously go straight to HikerAPI", () => {
  it("Stories, Highlights, single post/highlight and the combined profile never touch Instaloader", async () => {
    const { router, hiker, instaloader } = setup({});
    await router.getStories("alice", { userId: "1" });
    await router.getHighlights("alice", { userId: "1" });
    await router.getHighlightItems("https://www.instagram.com/stories/highlights/1/");
    await router.getPostByShortcode("ABC");
    await router.getProfile("alice");

    for (const fn of Object.values(instaloader)) expect(fn).not.toHaveBeenCalled();
    expect(hiker.getStories).toHaveBeenCalledWith("alice", { userId: "1" });
    expect(hiker.getHighlights).toHaveBeenCalledTimes(1);
    expect(hiker.getHighlightItems).toHaveBeenCalledTimes(1);
    expect(hiker.getPostByShortcode).toHaveBeenCalledTimes(1);
    expect(hiker.getProfile).toHaveBeenCalledTimes(1);
  });

  it("Stories are HikerAPI-only even when Scrape Creators is Primary", async () => {
    const { router, hiker, sc } = setup({}, { settings: { primary: "scrapecreators" } });
    await router.getStories("alice");
    expect(hiker.getStories).toHaveBeenCalledTimes(1);
    expect(sc.getStories).not.toHaveBeenCalled();
  });

  it("passes the user id hint through to the provider", async () => {
    const { router, hiker } = setup({}, { ready: false });
    await router.getPosts("alice", { userId: "42" });
    expect(hiker.getPosts).toHaveBeenCalledWith("alice", { userId: "42" });
  });
});

describe("no retry storms", () => {
  it("stops sending traffic to a failing Instaloader once its circuit opens", async () => {
    const instaloader = failing(timeout);
    const { router, hiker } = setup({ instaloader });

    // Threshold is 3: the first three requests each try Instaloader once, then fall back to HikerAPI once.
    for (let i = 0; i < 3; i++) await router.getBasicProfile(`user${i}`);
    expect(instaloader.getBasicProfile).toHaveBeenCalledTimes(3);
    expect(await isCircuitOpen("instaloader")).toBe(true);

    for (let i = 3; i < 8; i++) await router.getBasicProfile(`user${i}`);
    expect(instaloader.getBasicProfile).toHaveBeenCalledTimes(3); // no further attempts while open
    expect(hiker.getBasicProfile).toHaveBeenCalledTimes(8); // each request still got exactly one paid call
  });

  it("an isolated failure followed by success does not accumulate toward a trip", async () => {
    const instaloader = client({
      getBasicProfile: vi
        .fn()
        .mockRejectedValueOnce(timeout())
        .mockRejectedValueOnce(timeout())
        .mockResolvedValueOnce(profile("a"))
        .mockRejectedValueOnce(timeout())
        .mockRejectedValueOnce(timeout()),
    });
    const { router } = setup({ instaloader });
    for (let i = 0; i < 5; i++) await router.getBasicProfile("a");
    expect(await isCircuitOpen("instaloader")).toBe(false);
  });

  it("does not count our own call budget running out as a provider failure", async () => {
    const hiker = client({
      getBasicProfile: vi.fn(async () => { throw new CallBudgetError("HikerAPI", 4); }),
    });
    const { router } = setup({ hiker }, { ready: false });
    for (let i = 0; i < 6; i++) await expect(router.getBasicProfile("a")).rejects.toBeInstanceOf(CallBudgetError);
    expect(await isCircuitOpen("hikerapi")).toBe(false);
  });

  it("fails fast with no provider call when every provider in the plan has an open circuit", async () => {
    const hiker = failing(timeout);
    const { router } = setup({ hiker }, { ready: false });
    for (let i = 0; i < 3; i++) await expect(router.getBasicProfile("a")).rejects.toBeTruthy();
    expect(hiker.getBasicProfile).toHaveBeenCalledTimes(3);

    await expect(router.getBasicProfile("a")).rejects.toMatchObject({ message: expect.stringContaining("temporarily unavailable") });
    expect(hiker.getBasicProfile).toHaveBeenCalledTimes(3);
  });
});
