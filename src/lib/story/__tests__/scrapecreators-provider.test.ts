import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrapeCreatorsStoryProvider } from "../scrapecreators-provider";
import { recordCredits } from "../provider-stats";

vi.mock("../key-store", () => ({ getAllApiKeys: vi.fn(async () => ["sc_key_1", "sc_key_2"]) }));
vi.mock("../provider-stats", () => ({ recordCredits: vi.fn(async () => {}) }));
vi.mock("../rate-limit", () => ({ checkOutboundRateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }) }));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(recordCredits).mockClear();
});
afterEach(() => vi.unstubAllGlobals());

const sc = new ScrapeCreatorsStoryProvider();

describe("ScrapeCreatorsStoryProvider normalization", () => {
  it("maps a profile into the shared Profile shape, keeping zero and null distinct", async () => {
    fetchMock.mockResolvedValueOnce(
      json({
        credits_remaining: 90,
        credits_charged: 1,
        data: {
          user: {
            username: "alice",
            full_name: "Alice A",
            biography: null,
            profile_pic_url: "https://x/p.jpg",
            edge_followed_by: { count: 0 },
            edge_follow: null,
            is_private: false,
            is_verified: true,
            category_name: "",
            external_url: "",
          },
        },
      }),
    );
    const p = await sc.getBasicProfile("alice");
    expect(p).toMatchObject({
      username: "alice",
      fullName: "Alice A",
      bio: null,
      profileImage: "https://x/p.jpg",
      profileImageHd: "https://x/p.jpg",
      followers: 0,
      following: null,
      posts: null,
      isVerified: true,
      isPublic: true,
      stories: [],
      category: null,
      externalUrl: null,
    });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.scrapecreators.com/v1/instagram/profile?handle=alice");
    expect(fetchMock.mock.calls[0][1].headers["x-api-key"]).toBe("sc_key_1");
  });

  it("passes through a numeric user id, and treats a missing or odd one as unknown", async () => {
    const body = (id: unknown) => json({ data: { user: { username: "alice", id, is_private: false } } });
    fetchMock.mockResolvedValueOnce(body("12345"));
    expect((await sc.getBasicProfile("alice"))?.userId).toBe("12345");
    fetchMock.mockResolvedValueOnce(body(undefined));
    expect((await sc.getBasicProfile("alice"))?.userId).toBeNull();
    fetchMock.mockResolvedValueOnce(body("not-a-number"));
    expect((await sc.getBasicProfile("alice"))?.userId).toBeNull();
  });

  it("records credits_charged / credits_remaining from the response", async () => {
    fetchMock.mockResolvedValueOnce(json({ credits_remaining: 90, credits_charged: 2, data: { user: null } }));
    await sc.getBasicProfile("alice");
    expect(recordCredits).toHaveBeenCalledWith("scrapecreators", { charged: 2, remaining: 90 });
  });

  it("maps feed posts, carousels, reels and hidden counts", async () => {
    fetchMock.mockResolvedValueOnce(
      json({
        items: [
          {
            id: "1_9",
            pk: "1",
            code: "AAA",
            taken_at: 1700000000,
            caption: { text: "hi" },
            like_count: -1,
            comment_count: 0,
            product_type: "clips",
            media_type: 2,
            video_versions: [{ url: "https://x/v.mp4" }],
            image_versions2: { candidates: [{ url: "https://x/t.jpg" }] },
          },
          {
            pk: "2",
            code: "BBB",
            taken_at: 1700000001,
            caption: null,
            like_count: 5,
            comment_count: 1,
            carousel_media: [
              { media_type: 1, image_versions2: { candidates: [{ url: "https://x/1.jpg" }] } },
              { media_type: 2, video_versions: [{ url: "https://x/2.mp4" }], image_versions2: { candidates: [{ url: "https://x/2.jpg" }] } },
            ],
          },
          { pk: "3", code: "CCC" }, // no media at all → dropped
        ],
      }),
    );
    const posts = await sc.getPosts("alice");
    expect(posts).toHaveLength(2);
    expect(posts[0]).toEqual({
      id: "1",
      shortcode: "AAA",
      caption: "hi",
      timestamp: new Date(1700000000 * 1000).toISOString(),
      likeCount: null,
      commentCount: 0,
      items: [{ type: "video", mediaUrl: "https://x/v.mp4", thumbnailUrl: "https://x/t.jpg" }],
      isReel: true,
    });
    expect(posts[1].caption).toBeNull();
    expect(posts[1].items.map((i) => i.type)).toEqual(["image", "video"]);
    expect(posts[1].isReel).toBe(false);
  });

  it("maps a single post by shortcode", async () => {
    fetchMock.mockResolvedValueOnce(
      json({
        data: {
          xdt_shortcode_media: {
            id: "9",
            shortcode: "DLD",
            is_video: true,
            video_url: "https://x/v.mp4",
            display_url: "https://x/d.jpg",
            product_type: "clips",
            taken_at_timestamp: 1700000000,
            edge_media_to_caption: { edges: [{ node: { text: "cap" } }] },
            edge_media_preview_like: { count: 7 },
            edge_media_to_parent_comment: { count: 3 },
          },
        },
      }),
    );
    const post = await sc.getPostByShortcode("DLD");
    expect(post).toMatchObject({ id: "9", shortcode: "DLD", caption: "cap", likeCount: 7, commentCount: 3, isReel: true });
    expect(post?.items).toEqual([{ type: "video", mediaUrl: "https://x/v.mp4", thumbnailUrl: "https://x/d.jpg" }]);
    expect(decodeURIComponent(fetchMock.mock.calls[0][0])).toContain("url=https://www.instagram.com/p/DLD/");
  });

  it("maps highlights and highlight items", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ highlights: [{ id: "111", title: "T", cover_media_cropped_thumbnail: { url: "https://x/c.jpg" } }, { title: "no id" }] }),
    );
    expect(await sc.getHighlights("alice")).toEqual([{ id: "111", title: "T", coverImageUrl: "https://x/c.jpg", mediaCount: null }]);

    fetchMock.mockResolvedValueOnce(
      json({
        title: "T",
        cover_media: { cropped_image_version: { url: "https://x/c.jpg" } },
        items: [
          { pk: "5", taken_at: 1700000000, media_type: 2, video_duration: 12, video_versions: [{ url: "https://x/v.mp4" }], image_versions2: { candidates: [{ url: "https://x/t.jpg" }] } },
          { pk: "6", taken_at: 1700000001, media_type: 1, image_versions2: { candidates: [{ url: "https://x/i.jpg" }] } },
        ],
      }),
    );
    const detail = await sc.getHighlightItems("https://www.instagram.com/stories/highlights/18067016518767507/");
    expect(fetchMock.mock.calls[1][0]).toContain("/v1/instagram/user/highlight/detail?id=18067016518767507");
    expect(detail?.items.map((i) => [i.type, i.duration])).toEqual([["video", 12], ["image", 5]]);
  });
});

describe("ScrapeCreatorsStoryProvider transport", () => {
  it("returns null / [] on 404", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 404 }));
    expect(await sc.getBasicProfile("ghost")).toBeNull();
    expect(await sc.getPosts("ghost")).toEqual([]);
  });

  it("rotates to the next key on 401 and succeeds", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 401 })).mockResolvedValueOnce(json({ items: [] }));
    expect(await sc.getPosts("alice")).toEqual([]);
    expect(fetchMock.mock.calls[1][1].headers["x-api-key"]).toBe("sc_key_2");
  });

  it("marks every upstream failure retryable so HikerAPI can take over", async () => {
    for (const status of [429, 503, 403, 400]) {
      fetchMock.mockReset().mockResolvedValue(new Response("", { status }));
      await expect(sc.getPosts("alice")).rejects.toMatchObject({ retryable: true });
    }
    fetchMock.mockReset().mockRejectedValue(new TypeError("fetch failed"));
    await expect(sc.getPosts("alice")).rejects.toMatchObject({ retryable: true });
  });

  it("cannot serve Stories and says so instead of returning an empty list", async () => {
    await expect(sc.getProfile()).rejects.toMatchObject({ code: "CONTENT_UNAVAILABLE" });
  });

  it("rejects invalid usernames without calling the API", async () => {
    await expect(sc.getPosts("not valid!!")).rejects.toMatchObject({ retryable: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
