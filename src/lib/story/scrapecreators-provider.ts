import type { StoryProvider } from "./provider";
import { ProviderError } from "./provider";
import type { Profile } from "@/types/profile";
import type { Post, PostMediaItem } from "@/types/post";
import type { HighlightMeta } from "@/types/highlight";
import type { Story } from "@/types/story";
import { validateUsername } from "./validation";
import { checkOutboundRateLimit } from "./rate-limit";
import { getAllApiKeys } from "./key-store";
import { recordCredits } from "./provider-stats";

const SCRAPECREATORS_BASE = "https://api.scrapecreators.com";
const FETCH_TIMEOUT_MS = 15_000;

interface ScImageVersions {
  candidates?: { url?: string }[];
}
interface ScMedia {
  media_type?: number; // 1 = photo, 2 = video (also 8 = carousel)
  video_versions?: { url?: string }[];
  image_versions2?: ScImageVersions;
  display_uri?: string;
}
interface ScFeedItem extends ScMedia {
  id?: string;
  pk?: string | number;
  code?: string;
  taken_at?: number;
  caption?: { text?: string } | null;
  like_count?: number | null;
  comment_count?: number | null;
  product_type?: string | null;
  carousel_media?: ScMedia[] | null;
}
interface ScProfileUser {
  username?: string;
  full_name?: string | null;
  biography?: string | null;
  profile_pic_url?: string | null;
  profile_pic_url_hd?: string | null;
  edge_followed_by?: { count?: number | null } | null;
  edge_follow?: { count?: number | null } | null;
  edge_owner_to_timeline_media?: { count?: number | null } | null;
  is_private?: boolean;
  is_verified?: boolean;
  category_name?: string | null;
  external_url?: string | null;
}
interface ScPostNode {
  id?: string;
  shortcode?: string;
  is_video?: boolean;
  video_url?: string | null;
  display_url?: string | null;
  thumbnail_src?: string | null;
  product_type?: string | null;
  taken_at_timestamp?: number | null;
  edge_media_to_caption?: { edges?: { node?: { text?: string } }[] } | null;
  edge_media_preview_like?: { count?: number | null } | null;
  edge_media_to_parent_comment?: { count?: number | null } | null;
  edge_sidecar_to_children?: {
    edges?: { node?: { is_video?: boolean; video_url?: string | null; display_url?: string | null } }[];
  } | null;
}
interface ScHighlight {
  id?: string;
  title?: string;
  cover_media?: { thumbnail_src?: string } | null;
  cover_media_cropped_thumbnail?: { url?: string } | null;
}
interface ScHighlightItem extends ScMedia {
  pk?: string | number;
  id?: string;
  taken_at?: number;
  video_duration?: number;
}

/** Instagram reports hidden like/comment counts as -1 — that's "unavailable", not a count. */
function count(value: number | null | undefined): number | null {
  return typeof value === "number" && value >= 0 ? value : null;
}

function isoFromUnix(seconds: number | null | undefined): string | null {
  return typeof seconds === "number" && seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}

/**
 * Story-provider fallback backed by Scrape Creators (scrapecreators.com).
 * Deliberately implements only what its documented API actually offers:
 * profile metadata, posts/reels, a single post, highlights and highlight
 * items. It has no Stories endpoint, so `getProfile` (which must return a
 * profile *with* Stories) is intentionally absent rather than faked with an
 * empty list — the router skips providers that lack an operation.
 */
export class ScrapeCreatorsStoryProvider implements StoryProvider {
  async getProfile(): Promise<Profile | null> {
    throw new ProviderError("Scrape Creators cannot retrieve Stories.", "CONTENT_UNAVAILABLE");
  }

  async getBasicProfile(usernameInput: string): Promise<Profile | null> {
    const normalized = await this.preflight(usernameInput);
    const res = await this.request(`/v1/instagram/profile?handle=${encodeURIComponent(normalized)}`);
    if (res.status === 404) return null;

    const body = (await res.json()) as { data?: { user?: ScProfileUser | null } };
    const user = body.data?.user;
    if (!user) return null;

    return {
      username: user.username ?? normalized,
      profileImage: user.profile_pic_url ?? null,
      profileImageHd: user.profile_pic_url_hd ?? user.profile_pic_url ?? null,
      fullName: user.full_name ?? null,
      bio: user.biography ?? null,
      followers: count(user.edge_followed_by?.count),
      following: count(user.edge_follow?.count),
      posts: count(user.edge_owner_to_timeline_media?.count),
      isVerified: user.is_verified === true,
      isPublic: user.is_private === false,
      stories: [],
      category: user.category_name || null,
      externalUrl: user.external_url || null,
    };
  }

  async getPosts(usernameInput: string): Promise<Post[]> {
    const normalized = await this.preflight(usernameInput);
    const res = await this.request(`/v2/instagram/user/posts?handle=${encodeURIComponent(normalized)}`);
    if (res.status === 404) return [];

    const body = (await res.json()) as { items?: ScFeedItem[] };
    return (body.items ?? [])
      .map((item) => this.normalizeFeedItem(item))
      .filter((post): post is Post => post !== null);
  }

  async getPostByShortcode(shortcode: string): Promise<Post | null> {
    if (!/^[A-Za-z0-9_-]{2,20}$/.test(shortcode)) {
      throw new ProviderError("Invalid post URL.", "UPSTREAM_ERROR");
    }
    this.checkBudget();
    await this.requireKeys();

    const url = `https://www.instagram.com/p/${shortcode}/`;
    const res = await this.request(`/v1/instagram/post?url=${encodeURIComponent(url)}`);
    if (res.status === 404) return null;

    const body = (await res.json()) as { data?: { xdt_shortcode_media?: ScPostNode | null } };
    const node = body.data?.xdt_shortcode_media;
    return node ? this.normalizePostNode(node) : null;
  }

  async getHighlights(usernameInput: string): Promise<HighlightMeta[]> {
    const normalized = await this.preflight(usernameInput);
    const res = await this.request(`/v1/instagram/user/highlights?handle=${encodeURIComponent(normalized)}`);
    if (res.status === 404) return [];

    const body = (await res.json()) as { highlights?: ScHighlight[] };
    return (body.highlights ?? [])
      .filter((h): h is ScHighlight & { id: string } => typeof h.id === "string")
      .map((h) => ({
        id: h.id,
        title: h.title ?? "",
        coverImageUrl: h.cover_media_cropped_thumbnail?.url ?? h.cover_media?.thumbnail_src ?? null,
        // Scrape Creators' tray doesn't report an item count — null, not 0.
        mediaCount: null,
      }));
  }

  async getHighlightItems(
    highlightUrl: string,
  ): Promise<{ title: string; coverImageUrl: string | null; items: Story[] } | null> {
    const match = /^https:\/\/(www\.)?instagram\.com\/stories\/highlights\/(\d+)\/?$/i.exec(highlightUrl);
    if (!match) {
      throw new ProviderError("Invalid highlight URL.", "UPSTREAM_ERROR");
    }
    this.checkBudget();
    await this.requireKeys();

    const res = await this.request(`/v1/instagram/user/highlight/detail?id=${encodeURIComponent(match[2])}`);
    if (res.status === 404) return null;

    const detail = (await res.json()) as {
      title?: string;
      cover_media?: { cropped_image_version?: { url?: string } | null } | null;
      items?: ScHighlightItem[];
    };
    const items = (detail.items ?? [])
      .map((item) => this.normalizeHighlightItem(item))
      .filter((story): story is Story => story !== null);

    return {
      title: detail.title ?? "",
      coverImageUrl: detail.cover_media?.cropped_image_version?.url ?? null,
      items,
    };
  }

  // ---- normalization -----------------------------------------------------

  private normalizeHighlightItem(item: ScHighlightItem): Story | null {
    const media = this.mediaOf(item);
    if (!media) return null;
    return {
      id: String(item.pk ?? item.id ?? item.taken_at),
      type: media.type,
      mediaUrl: media.mediaUrl,
      thumbnailUrl: media.thumbnailUrl,
      timestamp: isoFromUnix(item.taken_at),
      // Same convention as the HikerAPI provider: images get the standard 5s.
      duration: item.video_duration ?? 5,
    };
  }

  private normalizeFeedItem(item: ScFeedItem): Post | null {
    const children = (item.carousel_media ?? [])
      .map((m) => this.mediaOf(m))
      .filter((m): m is PostMediaItem => m !== null);
    const own = this.mediaOf(item);
    const items = children.length > 0 ? children : own ? [own] : [];
    if (items.length === 0) return null;

    return {
      id: String(item.pk ?? item.id ?? item.code),
      shortcode: item.code ?? null,
      caption: item.caption?.text ?? null,
      timestamp: isoFromUnix(item.taken_at),
      likeCount: count(item.like_count),
      commentCount: count(item.comment_count),
      items,
      isReel: item.product_type === "clips",
    };
  }

  private normalizePostNode(node: ScPostNode): Post | null {
    const own = this.nodeMedia(node);
    const children = (node.edge_sidecar_to_children?.edges ?? [])
      .map((e) => (e.node ? this.nodeMedia(e.node) : null))
      .filter((m): m is PostMediaItem => m !== null);
    const items = children.length > 0 ? children : own ? [own] : [];
    if (items.length === 0) return null;

    return {
      id: String(node.id ?? node.shortcode),
      shortcode: node.shortcode ?? null,
      caption: node.edge_media_to_caption?.edges?.[0]?.node?.text ?? null,
      timestamp: isoFromUnix(node.taken_at_timestamp),
      likeCount: count(node.edge_media_preview_like?.count),
      commentCount: count(node.edge_media_to_parent_comment?.count),
      items,
      isReel: node.product_type === "clips",
    };
  }

  private nodeMedia(node: {
    is_video?: boolean;
    video_url?: string | null;
    display_url?: string | null;
    thumbnail_src?: string | null;
  }): PostMediaItem | null {
    const imageUrl = node.display_url ?? node.thumbnail_src ?? null;
    const videoUrl = node.is_video ? node.video_url : null;
    const mediaUrl = videoUrl ?? imageUrl;
    if (!mediaUrl) return null;
    return { type: videoUrl ? "video" : "image", mediaUrl, thumbnailUrl: imageUrl };
  }

  private mediaOf(m: ScMedia): PostMediaItem | null {
    const videoUrl = m.video_versions?.[0]?.url;
    const imageUrl = m.image_versions2?.candidates?.[0]?.url ?? m.display_uri;
    const mediaUrl = videoUrl ?? imageUrl;
    if (!mediaUrl) return null;
    return { type: videoUrl ? "video" : "image", mediaUrl, thumbnailUrl: imageUrl ?? null };
  }

  // ---- transport ---------------------------------------------------------

  private async preflight(usernameInput: string): Promise<string> {
    const { valid, normalized } = validateUsername(usernameInput);
    if (!valid) {
      throw new ProviderError("Invalid username.", "UPSTREAM_ERROR");
    }
    this.checkBudget();
    await this.requireKeys();
    return normalized;
  }

  private checkBudget() {
    if (!checkOutboundRateLimit().allowed) {
      throw new ProviderError("Upstream request budget exceeded for this window.", "RATE_LIMITED");
    }
  }

  private async requireKeys() {
    if ((await getAllApiKeys("scrapecreators")).length === 0) {
      throw new ProviderError("Scrape Creators is not configured.", "UPSTREAM_ERROR");
    }
  }

  /**
   * Tries each configured key in order, returning the first success or a
   * genuine 404. 401/403 (a bad key) and 402/429/5xx (credits, rate limit,
   * outage) move on to the next key; any other 4xx is a problem with the
   * request itself, so retrying it elsewhere can't help and it throws
   * immediately.
   */
  private async request(path: string): Promise<Response> {
    const keys = await getAllApiKeys("scrapecreators");
    let lastError: ProviderError | null = null;

    for (let i = 0; i < keys.length; i++) {
      let res: Response;
      try {
        res = await this.attempt(path, keys[i]);
      } catch (err) {
        lastError =
          err instanceof ProviderError
            ? err
            : new ProviderError("Failed to reach Scrape Creators.", "UPSTREAM_ERROR", err, true);
        continue;
      }

      if (res.ok) {
        await this.recordCreditsFrom(res);
        return res;
      }
      if (res.status === 404) return res;

      // Any Scrape Creators failure (bad key, no credits, rate limit, outage,
      // rejected request) is eligible for failover to HikerAPI. Only bad
      // *input* is excluded, and that's validated before any request is sent.
      const keyProblem = res.status === 401 || res.status === 403;
      const transient = res.status === 402 || res.status === 429 || res.status >= 500;
      if (!keyProblem && !transient) {
        throw new ProviderError(
          "Scrape Creators rejected the request.",
          "UPSTREAM_ERROR",
          `status=${res.status}`,
          true,
        );
      }
      lastError = new ProviderError(
        keyProblem
          ? "Scrape Creators rejected the API key."
          : res.status === 429
            ? "Rate limited by Scrape Creators."
            : "Scrape Creators returned an unexpected status.",
        res.status === 429 ? "RATE_LIMITED" : "UPSTREAM_ERROR",
        `status=${res.status}, key ${i + 1}/${keys.length}`,
        true,
      );
    }

    throw lastError ?? new ProviderError("Scrape Creators is unavailable.", "UPSTREAM_ERROR");
  }

  /** Reads `credits_charged` / `credits_remaining` off a clone, leaving the body for the caller. */
  private async recordCreditsFrom(res: Response) {
    try {
      const meta = (await res.clone().json()) as { credits_charged?: unknown; credits_remaining?: unknown };
      await recordCredits("scrapecreators", {
        charged: typeof meta.credits_charged === "number" ? meta.credits_charged : null,
        remaining: typeof meta.credits_remaining === "number" ? meta.credits_remaining : null,
      });
    } catch {
      // Credit bookkeeping must never fail a lookup.
    }
  }

  private async attempt(path: string, key: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      return await fetch(`${SCRAPECREATORS_BASE}${path}`, {
        signal: controller.signal,
        cache: "no-store",
        headers: { accept: "application/json", "x-api-key": key },
      });
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      throw new ProviderError(
        isTimeout ? "Scrape Creators request timed out." : "Failed to reach Scrape Creators.",
        isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR",
        err,
        true,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
