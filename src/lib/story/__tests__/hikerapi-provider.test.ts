import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeRedis } from "./fake-redis";

let redis: FakeRedis | null;
vi.mock("@/lib/redis", () => ({ getRedisClient: () => redis }));
vi.mock("../key-store", () => ({ getAllHikerApiKeys: vi.fn(async () => ["k1", "k2", "k3"]) }));
vi.mock("../rate-limit", () => ({ checkOutboundRateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }) }));

import { HikerApiStoryProvider } from "../hikerapi-provider";
import { CallBudget } from "../call-budget";
import { getMonthlyUsage, hikerUnitsFor, isBilled } from "../usage";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  redis = new FakeRedis();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const userBody = (over: Record<string, unknown> = {}) => ({
  user: { pk: 777, username: "alice", full_name: "A", biography: "", profile_pic_url: "https://x/a.jpg", follower_count: 5, following_count: 1, media_count: 3, is_private: false, is_verified: false, ...over },
});
const storiesBody = { reel: { items: [{ pk: 1, taken_at: 1700000000, image_versions2: { candidates: [{ url: "https://x/s.jpg" }] } }] } };
const urlOf = (i: number) => String(fetchMock.mock.calls[i][0]);

describe("HikerAPI call sequences and billing", () => {
  it("Stories by user id is ONE call (2 billed units), not a username lookup plus a Stories call", async () => {
    fetchMock.mockResolvedValueOnce(json(storiesBody));
    const stories = await new HikerApiStoryProvider().getStories("alice", { userId: "777" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(urlOf(0)).toBe("https://api.hikerapi.com/v2/user/stories?user_id=777");
    expect(stories).toHaveLength(1);
  });

  it("without a user id hint it resolves the username first (the old 1 + 2 sequence)", async () => {
    fetchMock.mockResolvedValueOnce(json(userBody())).mockResolvedValueOnce(json(storiesBody));
    await new HikerApiStoryProvider().getStories("alice");
    expect(urlOf(0)).toContain("/v2/user/by/username?username=alice");
    expect(urlOf(1)).toContain("/v2/user/stories?user_id=777");
  });

  it("returns no Stories for a private profile without buying them", async () => {
    fetchMock.mockResolvedValueOnce(json(userBody({ is_private: true })));
    expect(await new HikerApiStoryProvider().getStories("alice")).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("posts and highlights with a user id hint skip the username lookup", async () => {
    fetchMock.mockResolvedValueOnce(json([[], null])).mockResolvedValueOnce(json([]));
    const hk = new HikerApiStoryProvider();
    await hk.getPosts("alice", { userId: "777" });
    await hk.getHighlights("alice", { userId: "777" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(urlOf(0)).toBe("https://api.hikerapi.com/v1/user/medias/chunk?user_id=777");
    expect(urlOf(1)).toBe("https://api.hikerapi.com/v1/user/highlights?user_id=777");
  });

  it("exposes the user id on the profile so later calls can use it", async () => {
    fetchMock.mockResolvedValueOnce(json(userBody()));
    expect((await new HikerApiStoryProvider().getBasicProfile("alice"))?.userId).toBe("777");
  });

  it("a 404 from the (deprecated) posts endpoint is 'couldn't list', never an empty list", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 404 }));
    await expect(new HikerApiStoryProvider().getPosts("alice", { userId: "777" })).rejects.toMatchObject({ retryable: true });
  });

  it("a 404 from highlights is likewise an error, not 'no highlights'", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 404 }));
    await expect(new HikerApiStoryProvider().getHighlights("alice", { userId: "777" })).rejects.toMatchObject({ retryable: true });
  });
});

describe("per-request call budget (no retry storms through key rotation)", () => {
  it("stops after the budget even though more keys remain", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 429 }));
    const hk = new HikerApiStoryProvider(new CallBudget(2, "HikerAPI"));
    await expect(hk.getStories("alice", { userId: "777" })).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(fetchMock).toHaveBeenCalledTimes(2); // 3 keys exist, but only 2 calls were allowed
  });

  it("spans every call a single visitor request makes", async () => {
    fetchMock.mockResolvedValueOnce(json(userBody())).mockResolvedValueOnce(json(storiesBody));
    const hk = new HikerApiStoryProvider(new CallBudget(2, "HikerAPI"));
    await hk.getStories("alice"); // profile + stories = the whole budget
    await expect(hk.getStories("bob", { userId: "5" })).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("makes no HTTP call at all once the budget is spent", async () => {
    const budget = new CallBudget(1, "HikerAPI");
    budget.take();
    fetchMock.mockResolvedValue(json(storiesBody));
    await expect(new HikerApiStoryProvider(budget).getStories("alice", { userId: "1" })).rejects.toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("usage metering: endpoint-specific estimated billing", () => {
  it("knows HikerAPI's documented multi-unit endpoints", () => {
    expect(hikerUnitsFor("/v2/user/by/username?username=alice")).toBe(1);
    expect(hikerUnitsFor("/v2/user/stories?user_id=1")).toBe(2);
    expect(hikerUnitsFor("/v1/user/highlights?user_id=1")).toBe(2);
    expect(hikerUnitsFor("/v2/user/stories/by/username?username=a")).toBe(3);
    expect(hikerUnitsFor("/v1/user/medias/chunk?user_id=1")).toBe(1);
  });

  it("bills successful responses and 4xx, but not 5xx, 429 or no response", () => {
    expect([200, 404, 400, 403].every(isBilled)).toBe(true);
    expect([500, 503, 429, null].some((s) => isBilled(s))).toBe(false);
  });

  it("records calls and units per endpoint without storing usernames", async () => {
    fetchMock
      .mockResolvedValueOnce(json(userBody()))
      .mockResolvedValueOnce(json(storiesBody))
      .mockResolvedValueOnce(new Response("", { status: 503 }));
    const hk = new HikerApiStoryProvider();
    await hk.getStories("alice"); // 1 + 2 = 3 units
    await expect(hk.getStories("alice", { userId: "777" })).rejects.toBeTruthy(); // 503 on every key: calls, but no units

    const usage = await getMonthlyUsage();
    expect(usage?.hiker.unitsTotal).toBe(3);
    expect(usage?.hiker.callsTotal).toBe(1 + 1 + 3); // 3 keys tried on the failing call
    const stories = usage?.hiker.perEndpoint.find((e) => e.endpoint === "/v2/user/stories");
    expect(stories).toMatchObject({ calls: 4, units: 2 });
    expect(JSON.stringify(usage)).not.toContain("alice");
    expect(redis!.keys().some((k) => k.includes("alice"))).toBe(false);
  });

  it("raises an alert once a monthly unit threshold is crossed, exactly once", async () => {
    vi.stubEnv("HIKERAPI_MONTHLY_UNIT_LIMIT", "4");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockImplementation(async () => json(storiesBody));
    const hk = new HikerApiStoryProvider();
    for (let i = 0; i < 4; i++) await hk.getStories("alice", { userId: "1" }); // 2 units each = 8 > limit 4
    const alerts = warn.mock.calls.filter((c) => String(c[0]).includes("monthly units"));
    expect(alerts).toHaveLength(2); // the 80% and 100% thresholds, once each
    expect((await getMonthlyUsage())?.hiker.alerts.map((a) => a.pct)).toEqual([80, 100]);
    vi.unstubAllEnvs();
  });

  it("without Redis, metering is skipped and lookups still work", async () => {
    redis = null;
    fetchMock.mockResolvedValueOnce(json(storiesBody));
    expect(await new HikerApiStoryProvider().getStories("alice", { userId: "1" })).toHaveLength(1);
    expect(await getMonthlyUsage()).toBeNull();
  });
});
