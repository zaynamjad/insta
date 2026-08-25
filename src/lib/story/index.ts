import type { StoryProvider } from "./provider";
import { PublicWebStoryProvider } from "./public-web-provider";

export type { StoryProvider } from "./provider";
export { ProviderError } from "./provider";

let cachedProvider: StoryProvider | null = null;

/**
 * Single point of control for which implementation powers story/profile
 * lookups. Everything downstream (route handlers, `/profile/[username]`)
 * depends only on the `StoryProvider` interface — a future replacement
 * (e.g. if Instagram ever grants explicit permission, or a licensed
 * vendor becomes available) only needs to change this function.
 */
export function getProvider(): StoryProvider {
  if (!cachedProvider) {
    cachedProvider = new PublicWebStoryProvider();
  }
  return cachedProvider;
}
