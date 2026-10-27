import type { StoryProvider } from "./provider";
import { ProviderError } from "./provider";
import type { Profile } from "@/types/profile";
import type { Post, PostMediaItem } from "@/types/post";
import { validateUsername } from "./validation";
import { getInstaloaderStatus, type InstaloaderStatus } from "./hybrid-config";

/**
 * Client for the Python function in `api/ig_fetch.py` (Instaloader). It only
 * ever calls the one configured function URL — never a user-supplied one —
 * and offers only what that function can serve anonymously: profile metadata
 * and the first page of posts/reels. Stories and Highlights are deliberately
 * absent (Instagram requires a login for them), so the router sends those
 * straight to HikerAPI.
 *
 * Every failure is mapped to a `ProviderError` with `retryable: true` except
 * invalid input: anonymous Instagram access is unreliable by nature, so the
 * router treats "Instaloader couldn't" as "ask the next provider", not as an
 * answer. A confirmed "no such profile" is the one definitive negative.
 */

type Category =
  | "invalid_input"
  | "unauthorized"
  | "not_found"
  | "unsupported"
  | "login_required"
  | "rate_limited"
  | "upstream_error"
  | "disabled"
  | "timeout";

interface IgProfile {
  user_id?: string;
  username?: string;
  full_name?: string | null;
  biography?: string | null;
  profile_pic_url?: string | null;
  followers?: number | null;
  following?: number | null;
  posts?: number | null;
  is_private?: boolean;
  is_verified?: boolean;
  category?: string | null;
  external_url?: string | null;
}

interface IgPost {
  id?: string;
  shortcode?: string | null;
  caption?: string | null;
  timestamp?: string | null;
  likes?: number | null;
  comments?: number | null;
  is_reel?: boolean;
  items?: { type?: string; url?: string; thumbnail?: string | null }[];
}

interface IgResponse {
  ok?: boolean;
  data?: { profile?: IgProfile; posts?: IgPost[] };
  error?: { category?: Category };
}

/** Hidden or unavailable counts come back as null or negative; zero is a real count and is kept. */
function count(value: number | null | undefined): number | null {
  return typeof value === "number" && value >= 0 ? value : null;
}

export class InstaloaderStoryProvider implements StoryProvider {
  constructor(private readonly status: () => InstaloaderStatus = () => getInstaloaderStatus()) {}

  async getProfile(): Promise<Profile | null> {
    throw new ProviderError("Instaloader cannot retrieve Stories.", "CONTENT_UNAVAILABLE");
  }

  async getBasicProfile(usernameInput: string): Promise<Profile | null> {
    const data = await this.call("profile", usernameInput);
    if (!data) return null;
    return this.normalizeProfile(data.profile, usernameInput);
  }

  async getPosts(usernameInput: string): Promise<Post[]> {
    const data = await this.call("posts", usernameInput);
    if (!data) return [];
    return (data.posts ?? []).map((p) => this.normalizePost(p)).filter((p): p is Post => p !== null);
  }

  private normalizeProfile(p: IgProfile | undefined, fallbackName: string): Profile {
    if (!p || !p.username) {
      // A 200 without the fields we need is a malformed answer, never "an empty profile".
      throw new ProviderError("Instaloader returned an unexpected response.", "UPSTREAM_ERROR", undefined, true);
    }
    const image = p.profile_pic_url ?? null;
    return {
      username: p.username || fallbackName,
      profileImage: image,
      profileImageHd: image,
      fullName: p.full_name || null,
      bio: p.biography || null,
      followers: count(p.followers),
      following: count(p.following),
      posts: count(p.posts),
      isVerified: p.is_verified === true,
      isPublic: p.is_private === false,
      stories: [],
      category: p.category || null,
      externalUrl: p.external_url || null,
      userId: p.user_id ? String(p.user_id) : null,
    };
  }

  private normalizePost(p: IgPost): Post | null {
    const items = (p.items ?? [])
      .filter((i): i is { type?: string; url: string; thumbnail?: string | null } => typeof i.url === "string" && i.url !== "")
      .map<PostMediaItem>((i) => ({
        type: i.type === "video" ? "video" : "image",
        mediaUrl: i.url,
        thumbnailUrl: i.thumbnail ?? null,
      }));
    if (items.length === 0) return null;

    return {
      id: String(p.id ?? p.shortcode),
      shortcode: p.shortcode ?? null,
      caption: p.caption ?? null,
      timestamp: p.timestamp ?? null,
      likeCount: count(p.likes),
      commentCount: count(p.comments),
      items,
      isReel: p.is_reel === true,
    };
  }

  /** Returns the function's data, or null for a confirmed "no such profile". */
  private async call(feature: "profile" | "posts", usernameInput: string): Promise<IgResponse["data"] | null> {
    const { valid, normalized } = validateUsername(usernameInput);
    if (!valid) throw new ProviderError("Invalid username.", "UPSTREAM_ERROR");

    const status = this.status();
    if (status.state === "disabled") {
      throw new ProviderError("Instaloader is disabled.", "CONTENT_UNAVAILABLE", undefined, true);
    }
    if (status.state === "misconfigured") {
      throw new ProviderError(`Instaloader is misconfigured: ${status.problem}`, "UPSTREAM_ERROR", undefined, true);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), status.timeoutMs);
    let res: Response;
    try {
      res = await fetch(status.url, {
        method: "POST",
        signal: controller.signal,
        cache: "no-store",
        headers: { "content-type": "application/json", "x-instaloader-secret": status.secret },
        body: JSON.stringify({ feature, username: normalized, limit: 12 }),
      });
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      throw new ProviderError(
        isTimeout ? "Instaloader request timed out." : "Failed to reach Instaloader.",
        isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR",
        undefined,
        true,
      );
    } finally {
      clearTimeout(timer);
    }

    let body: IgResponse;
    try {
      body = (await res.json()) as IgResponse;
    } catch {
      throw new ProviderError("Instaloader returned a non-JSON response.", "UPSTREAM_ERROR", `status=${res.status}`, true);
    }

    if (body.ok && body.data) return body.data;

    const category = body.error?.category ?? "upstream_error";
    if (category === "not_found") return null;
    if (category === "invalid_input") throw new ProviderError("Invalid username.", "UPSTREAM_ERROR");

    throw new ProviderError(
      `Instaloader could not serve this request (${category}).`,
      category === "rate_limited" ? "RATE_LIMITED" : category === "timeout" ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR",
      `status=${res.status}`,
      true,
    );
  }
}
