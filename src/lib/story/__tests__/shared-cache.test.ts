import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeRedis } from "./fake-redis";

let redis: FakeRedis | null = null;
vi.mock("@/lib/redis", () => ({ getRedisClient: () => redis }));
vi.mock("../usage", () => ({ recordCacheEvent: vi.fn(async () => {}) }));

import { cachedLoad, resetSharedCacheForTests, isSharedCacheAvailable } from "../shared-cache";
import { recordCacheEvent } from "../usage";

beforeEach(() => {
  redis = new FakeRedis();
  resetSharedCacheForTests();
  vi.mocked(recordCacheEvent).mockClear();
});
afterEach(() => vi.useRealTimers());

const opts = (load: () => Promise<unknown>, ttl = 60, key = "k:alice") => ({
  feature: "profile",
  key,
  load,
  ttlSeconds: () => ttl,
});

describe("cachedLoad (shared Redis)", () => {
  it("serves a cache hit without calling the loader again", async () => {
    const load = vi.fn(async () => ({ name: "alice" }));
    expect(await cachedLoad(opts(load))).toEqual({ name: "alice" });
    expect(await cachedLoad(opts(load))).toEqual({ name: "alice" });
    expect(load).toHaveBeenCalledTimes(1);
    expect(recordCacheEvent).toHaveBeenCalledWith("profile", false);
    expect(recordCacheEvent).toHaveBeenCalledWith("profile", true);
  });

  it("shares a result across instances: a second instance with its own process state still hits", async () => {
    const load = vi.fn(async () => "value");
    await cachedLoad(opts(load));
    resetSharedCacheForTests(); // a different serverless instance: no in-process state, same Redis
    expect(await cachedLoad(opts(load))).toBe("value");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("deduplicates simultaneous identical requests into one upstream call", async () => {
    let release!: (v: string) => void;
    const load = vi.fn(() => new Promise<string>((r) => (release = r)));
    const calls = Promise.all([cachedLoad(opts(load)), cachedLoad(opts(load)), cachedLoad(opts(load))]);
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    release("shared");
    expect(await calls).toEqual(["shared", "shared", "shared"]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("waits on another instance's lock and uses its result instead of loading again", async () => {
    // Another instance holds the lock for this key and will store its value shortly.
    await redis!.set("lock:story-cache:k:alice", "other-instance", { ex: 20 });
    setTimeout(() => void redis!.set("story-cache:k:alice", { v: "from-other" }, { ex: 60 }), 250);

    const load = vi.fn(async () => "own");
    expect(await cachedLoad(opts(load))).toBe("from-other");
    expect(load).not.toHaveBeenCalled();
  });

  it("rechecks the cache after taking the lock", async () => {
    const load = vi.fn(async () => "own");
    const realGet = redis!.get.bind(redis!);
    let first = true;
    // The first read misses (we start loading), but by the time we hold the lock another instance has stored the value.
    redis!.get = (async (key: string) => {
      if (key === "story-cache:k:alice" && first) {
        first = false;
        void redis!.set("story-cache:k:alice", { v: "filled-meanwhile" }, { ex: 60 });
        return null;
      }
      return realGet(key);
    }) as never;

    expect(await cachedLoad(opts(load))).toBe("filled-meanwhile");
    expect(load).not.toHaveBeenCalled();
  });

  it("releases its lock after loading", async () => {
    await cachedLoad(opts(async () => 1));
    expect(redis!.keys().filter((k) => k.startsWith("lock:"))).toEqual([]);
  });

  it("never caches a failed load, and the next call tries again", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("upstream down")).mockResolvedValueOnce("ok");
    await expect(cachedLoad(opts(load))).rejects.toThrow("upstream down");
    expect(await cachedLoad(opts(load))).toBe("ok");
    expect(load).toHaveBeenCalledTimes(2);
    expect(redis!.keys().filter((k) => k.startsWith("lock:"))).toEqual([]);
  });

  it("does not cache a value whose TTL is 0 (e.g. an error result)", async () => {
    const load = vi.fn(async () => ({ status: "error" }));
    await cachedLoad(opts(load, 0));
    await cachedLoad(opts(load, 0));
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("can cache a legitimate null (a confirmed not-found) distinct from a miss", async () => {
    const load = vi.fn(async () => null);
    expect(await cachedLoad(opts(load))).toBeNull();
    expect(await cachedLoad(opts(load))).toBeNull();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("still serves the request when Redis errors", async () => {
    redis!.get = vi.fn(async () => {
      throw new Error("redis down");
    }) as never;
    redis!.set = vi.fn(async () => {
      throw new Error("redis down");
    }) as never;
    const load = vi.fn(async () => "fresh");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await cachedLoad(opts(load))).toBe("fresh");
  });
});

describe("cachedLoad without Redis", () => {
  it("falls back to per-process caching and says it is not shared", async () => {
    redis = null;
    expect(isSharedCacheAvailable()).toBe(false);
    const load = vi.fn(async () => "v");
    await cachedLoad(opts(load));
    await cachedLoad(opts(load));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("still does not cache failures", async () => {
    redis = null;
    const load = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce("ok");
    await expect(cachedLoad(opts(load))).rejects.toThrow("boom");
    expect(await cachedLoad(opts(load))).toBe("ok");
  });
});
