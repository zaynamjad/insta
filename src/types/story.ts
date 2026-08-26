import type { Profile } from "./profile";
import type { ProviderErrorCode } from "@/lib/story/provider";

export type StoryMediaType = "image" | "video";

/**
 * INVALID_USERNAME and INVALID_REQUEST sit on top of ProviderErrorCode —
 * both are request-validation/API-guardrail failures (bad username format,
 * cross-site origin, oversized body, malformed JSON), never something a
 * provider itself would throw.
 */
export type StoryErrorCode = ProviderErrorCode | "INVALID_USERNAME" | "INVALID_REQUEST";

export interface Story {
  id: string;
  type: StoryMediaType;
  mediaUrl: string;
  thumbnailUrl: string | null;
  timestamp: string | null;
  duration: number;
}

export type StoryLookupStatus =
  | "ok"
  | "no_stories"
  | "not_found"
  | "private"
  | "error";

export interface StoryLookupSuccess {
  status: "ok";
  profile: Profile;
}

export interface StoryLookupNoStories {
  status: "no_stories";
  profile: Profile;
}

export interface StoryLookupNotFound {
  status: "not_found";
  username: string;
}

export interface StoryLookupPrivate {
  status: "private";
  profile: Profile;
}

export interface StoryLookupError {
  status: "error";
  code: StoryErrorCode;
  message: string;
}

export type StoryLookupResult =
  | StoryLookupSuccess
  | StoryLookupNoStories
  | StoryLookupNotFound
  | StoryLookupPrivate
  | StoryLookupError;
