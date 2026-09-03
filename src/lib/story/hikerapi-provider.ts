import type { StoryProvider } from "./provider";
import { ProviderError } from "./provider";
import type { Profile } from "@/types/profile";
import type { Story } from "@/types/story";
import { validateUsername } from "./validation";
import { checkOutboundRateLimit } from "./rate-limit";

const HIKERAPI_KEY = process.env.HIKERAPI_KEY;
const HIKERAPI_BASE = "https://api.hikerapi.com";
const FETCH_TIMEOUT_MS = 15_000;

interface HikerUser {
  pk: number | string;
  username: string;
  full_name: string | null;
  biography: string | null;
  profile_pic_url: string | null;
  follower_count: number | null;
  following_count: number | null;
  media_count: number | null;
  is_private: boolean;
  is_verified: boolean;
}

interface HikerStoryItem {
  id?: string;
  pk?: number | string;
  taken_at: number;
  video_versions?: { url: string }[];
  image_versions2?: { candidates?: { url: string }[] };
  video_duration?: number;
}

interface HikerStoriesResponse {
  reel: { items?: HikerStoryItem[] } | null;
  status: string;
}

/**
 * Story provider backed by HikerAPI (hikerapi.com) — a licensed data
 * vendor that maintains its own authenticated Instagram session
 * server-side. Unlike `PublicWebStoryProvider`, this can actually return
 * Story media, because the request never touches Instagram directly: we
 * pay for an API call, HikerAPI owns the session and the account risk.
 */
export class HikerApiStoryProvider implements StoryProvider {
  async getProfile(usernameInput: string): Promise<Profile | null> {
    const { valid, normalized } = validateUsername(usernameInput);
    if (!valid) {
      throw new ProviderError("Invalid username.", "UPSTREAM_ERROR");
    }

    if (!checkOutboundRateLimit().allowed) {
      throw new ProviderError(
        "Upstream request budget exceeded for this window.",
        "RATE_LIMITED",
      );
    }

    if (!HIKERAPI_KEY) {
      throw new ProviderError("HIKERAPI_KEY is not configured.", "UPSTREAM_ERROR");
    }

    const user = await this.fetchUser(normalized);
    if (!user) return null;

    const isPublic = user.is_private === false;
    const stories = isPublic ? await this.fetchStories(user.pk) : [];

    return {
      username: user.username,
      profileImage: user.profile_pic_url,
      fullName: user.full_name,
      bio: user.biography,
      followers: user.follower_count,
      following: user.following_count,
      posts: user.media_count,
      isVerified: user.is_verified,
      isPublic,
      stories,
    };
  }

  private async fetchUser(username: string): Promise<HikerUser | null> {
    const res = await this.request(`/v2/user/by/username?username=${encodeURIComponent(username)}`);

    if (res.status === 404) return null;

    if (res.status === 401) {
      throw new ProviderError("HikerAPI rejected the access key.", "UPSTREAM_ERROR", "401 Unauthorized");
    }

    if (res.status === 429) {
      throw new ProviderError("Rate limited by HikerAPI.", "RATE_LIMITED");
    }

    if (!res.ok) {
      throw new ProviderError(
        "HikerAPI returned an unexpected status.",
        "UPSTREAM_ERROR",
        `status=${res.status}`,
      );
    }

    const body = (await res.json()) as { user?: HikerUser };
    return body.user ?? null;
  }

  private async fetchStories(userId: HikerUser["pk"]): Promise<Story[]> {
    const res = await this.request(`/v2/user/stories?user_id=${encodeURIComponent(String(userId))}`);

    // A stories-fetch failure degrades to "no stories" rather than failing
    // the whole profile lookup — we already have a valid profile to show.
    if (!res.ok) return [];

    const body = (await res.json()) as HikerStoriesResponse;
    if (!body.reel?.items?.length) return [];

    return body.reel.items
      .map((item) => this.normalizeStoryItem(item))
      .filter((story): story is Story => story !== null);
  }

  private normalizeStoryItem(item: HikerStoryItem): Story | null {
    const videoUrl = item.video_versions?.[0]?.url;
    const imageUrl = item.image_versions2?.candidates?.[0]?.url;
    const mediaUrl = videoUrl ?? imageUrl;
    if (!mediaUrl) return null;

    return {
      id: String(item.pk ?? item.id ?? item.taken_at),
      type: videoUrl ? "video" : "image",
      mediaUrl,
      thumbnailUrl: imageUrl ?? null,
      timestamp: item.taken_at ? new Date(item.taken_at * 1000).toISOString() : null,
      duration: item.video_duration ?? 0,
    };
  }

  private async request(path: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      return await fetch(`${HIKERAPI_BASE}${path}`, {
        signal: controller.signal,
        cache: "no-store",
        headers: {
          accept: "application/json",
          "x-access-key": HIKERAPI_KEY as string,
        },
      });
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      throw new ProviderError(
        isTimeout ? "HikerAPI request timed out." : "Failed to reach HikerAPI.",
        isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR",
        err,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
