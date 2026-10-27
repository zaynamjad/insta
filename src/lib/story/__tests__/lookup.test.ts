import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeRedis } from "./fake-redis";
import { ProviderError, type StoryProvider } from "../provider";
import type { Profile } from "@/types/profile";
import type { Story } from "@/types/story";
import type { Post } from "@/types/post";

let redis: FakeRedis;
let provider: StoryProvider;
const getProviderMock = vi.fn(async () => provider);

vi.mock("@/lib/redis", () => ({ getRedisClient: () => redis }));
vi.mock("../usage", () => ({ recordCacheEvent: vi.fn(async () => {}) }));
vi.mock("../index", async () => {
  const { ProviderError } = await import("../provider");
  return { getProvider: () => getProviderMock(), ProviderError };
});

import { lookupStory } from "../lookup";
import { lookupPosts } from "../posts-lookup";
import { lookupHighlights } from "../highlights-lookup";
import { lookupPostByShortcode } from "../post-lookup";
import { resetSharedCacheForTests } from "../shared-cache";

const profile = (over: Partial<Profile> = {}): Profile => ({
  username: "alice",
  profileImage: "https://cdn/a.jpg",
  profileImageHd: "https://cdn/a-hd.jpg",
  fullName: "Alice",
  bio: "hi",
  followers: 10,
  following: 0,
  posts: 5,
  isVerified: false,
  isPublic: true,
  stories: [],
  category: null,
  externalUrl: null,
  userId: "999",
  ...over,
});

const story: Story = { id: "s1", type: "image", mediaUrl: "https://cdn/s.jpg", thumbnailUrl: null, timestamp: null, duration: 5 };
const post: Post = { id: "p1", shortcode: "AAA", caption: null, timestamp: null, likeCount: null, commentCount: null, items: [{ type: "image", mediaUrl: "https://cdn/p.jpg", thumbnailUrl: null }], isReel: false };

function makeProvider(over: Partial<StoryProvider> = {}): StoryProvider {
  return {
    getProfile: vi.fn(async () => profile({ stories: [story] })),
    getBasicProfile: vi.fn(async () => profile()),
    getStories: vi.fn(async () => [story]),
    getPosts: vi.fn(async () => [post]),
    getHighlights: vi.fn(async () => []),
    getPostByShortcode: vi.fn(async () => post),
    ...over,
  };
}

beforeEach(() => {
  redis = new FakeRedis();
  provider = makeProvider();
  getProviderMock.mockClear();
  resetSharedCacheForTests();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.useRealTimers());

describe("input validation happens before any provider work", () => {
  it.each(["", "not valid!!", "a..b", "x".repeat(31), 42, null])("rejects %j without touching a provider or the cache", async (input) => {
    expect(await lookupStory(input)).toMatchObject({ status: "error", code: "INVALID_USERNAME" });
    expect(await lookupPosts(input)).toMatchObject({ status: "error", code: "INVALID_USERNAME" });
    expect(await lookupHighlights(input)).toMatchObject({ status: "error", code: "INVALID_USERNAME" });
    expect(getProviderMock).not.toHaveBeenCalled();
    expect(redis.commands).toEqual([]);
  });

  it("normalizes case, @ and pasted URLs to one cache entry", async () => {
    await lookupStory("Alice");
    await lookupStory("@alice");
    await lookupStory("https://www.instagram.com/alice/");
    expect(provider.getBasicProfile).toHaveBeenCalledTimes(1);
  });
});

describe("cache hits avoid upstream requests; misses call the provider once", () => {
  it("a repeat search costs no provider calls at all", async () => {
    const first = await lookupStory("alice");
    expect(provider.getBasicProfile).toHaveBeenCalledTimes(1);
    expect(provider.getStories).toHaveBeenCalledTimes(1);

    const second = await lookupStory("alice");
    expect(second).toEqual(first);
    expect(provider.getBasicProfile).toHaveBeenCalledTimes(1);
    expect(provider.getStories).toHaveBeenCalledTimes(1);
  });

  it("buys Stories by user id, not by re-resolving the username", async () => {
    await lookupStory("alice");
    expect(provider.getStories).toHaveBeenCalledWith("alice", { userId: "999" });
  });

  it("shares the profile entry with Posts and Highlights, so opening tabs adds no profile lookup", async () => {
    await lookupStory("alice");
    await lookupPosts("alice");
    await lookupHighlights("alice");
    expect(provider.getBasicProfile).toHaveBeenCalledTimes(1);
    expect(provider.getPosts).toHaveBeenCalledWith("alice", { userId: "999" });
    expect(provider.getHighlights).toHaveBeenCalledWith("alice", { userId: "999" });
  });

  it("Stories expire on their own short TTL while the profile stays cached", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    await lookupStory("alice");
    vi.setSystemTime(Date.now() + 3 * 60_000); // past the 2-minute stories TTL, well inside the 6-hour profile TTL
    await lookupStory("alice");
    expect(provider.getStories).toHaveBeenCalledTimes(2);
    expect(provider.getBasicProfile).toHaveBeenCalledTimes(1);
  });

  it("caches 'not found' only briefly", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    provider = makeProvider({ getBasicProfile: vi.fn(async () => null) });
    expect(await lookupStory("ghost")).toEqual({ status: "not_found", username: "ghost" });
    await lookupStory("ghost");
    expect(provider.getBasicProfile).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 31_000);
    await lookupStory("ghost");
    expect(provider.getBasicProfile).toHaveBeenCalledTimes(2);
  });
});

describe("failures are never cached as valid empty results", () => {
  it("a provider error returns an error result and the next call retries", async () => {
    provider = makeProvider({
      getBasicProfile: vi
        .fn()
        .mockRejectedValueOnce(new ProviderError("down", "UPSTREAM_TIMEOUT", undefined, true))
        .mockResolvedValueOnce(profile()),
    });
    expect(await lookupStory("alice")).toMatchObject({ status: "error", code: "UPSTREAM_TIMEOUT" });
    expect(await lookupStory("alice")).toMatchObject({ status: "ok" });
    expect(provider.getBasicProfile).toHaveBeenCalledTimes(2);
  });

  it("a failed Stories fetch is an error, not a cached 'no stories'", async () => {
    provider = makeProvider({
      getStories: vi
        .fn()
        .mockRejectedValueOnce(new ProviderError("429", "RATE_LIMITED", undefined, true))
        .mockResolvedValueOnce([story]),
    });
    expect(await lookupStory("alice")).toMatchObject({ status: "error", code: "RATE_LIMITED" });
    expect(await lookupStory("alice")).toMatchObject({ status: "ok" });
  });

  it("a failed posts fetch is retried, not remembered as an empty list", async () => {
    provider = makeProvider({
      getPosts: vi.fn().mockRejectedValueOnce(new ProviderError("404", "UPSTREAM_ERROR", undefined, true)).mockResolvedValueOnce([post]),
    });
    expect(await lookupPosts("alice")).toMatchObject({ status: "error" });
    expect(await lookupPosts("alice")).toMatchObject({ status: "ok", posts: [post] });
  });

  it("an empty posts list is trusted only briefly", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    provider = makeProvider({ getPosts: vi.fn(async () => []) });
    await lookupPosts("alice");
    await lookupPosts("alice");
    expect(provider.getPosts).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 31_000);
    await lookupPosts("alice");
    expect(provider.getPosts).toHaveBeenCalledTimes(2);
  });

  it("skips the posts provider call entirely when the profile reports zero posts", async () => {
    provider = makeProvider({ getBasicProfile: vi.fn(async () => profile({ posts: 0 })) });
    expect(await lookupPosts("alice")).toEqual({ status: "ok", posts: [] });
    expect(provider.getPosts).not.toHaveBeenCalled();
  });

  it("single-post errors are not cached", async () => {
    provider = makeProvider({
      getPostByShortcode: vi.fn().mockRejectedValueOnce(new ProviderError("x", "UPSTREAM_ERROR", undefined, true)).mockResolvedValueOnce(post),
    });
    expect(await lookupPostByShortcode("AAA")).toMatchObject({ status: "error" });
    expect(await lookupPostByShortcode("AAA")).toMatchObject({ status: "ok" });
  });
});

describe("existing frontend response contract", () => {
  it("ok: { status, profile } with the Profile fields the UI reads, and no internal user id", async () => {
    const result = await lookupStory("alice");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("unreachable");
    expect(Object.keys(result).sort()).toEqual(["profile", "status"]);
    expect(Object.keys(result.profile).sort()).toEqual(
      ["bio", "category", "externalUrl", "followers", "following", "fullName", "isPublic", "isVerified", "posts", "profileImage", "profileImageHd", "stories", "username"].sort(),
    );
    expect(result.profile.stories).toEqual([story]);
  });

  it("no_stories, private and not_found keep their shapes", async () => {
    provider = makeProvider({ getStories: vi.fn(async () => []) });
    expect(await lookupStory("alice")).toMatchObject({ status: "no_stories", profile: { username: "alice", stories: [] } });

    resetSharedCacheForTests();
    redis = new FakeRedis();
    provider = makeProvider({ getBasicProfile: vi.fn(async () => profile({ isPublic: false })) });
    const priv = await lookupStory("alice");
    expect(priv).toMatchObject({ status: "private" });
    expect(provider.getStories).not.toHaveBeenCalled(); // never pay for Stories of a private profile
    expect("userId" in (priv as { profile: Profile }).profile).toBe(false);
  });

  it("a provider without a separate Stories source keeps the original one-shot behavior", async () => {
    const legacy: StoryProvider = { getProfile: vi.fn(async () => profile({ stories: [story] })) };
    provider = legacy;
    expect(await lookupStory("alice")).toMatchObject({ status: "ok", profile: { stories: [story] } });
    expect(legacy.getProfile).toHaveBeenCalledTimes(1);
  });
});
