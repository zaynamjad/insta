import type { Profile } from "./profile";

export type StoryMediaType = "image" | "video";

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
  message: string;
}

export type StoryLookupResult =
  | StoryLookupSuccess
  | StoryLookupNoStories
  | StoryLookupNotFound
  | StoryLookupPrivate
  | StoryLookupError;
