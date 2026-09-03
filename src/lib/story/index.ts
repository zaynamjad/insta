import type { StoryProvider } from "./provider";
import { PublicWebStoryProvider } from "./public-web-provider";
import { HikerApiStoryProvider } from "./hikerapi-provider";

export type { StoryProvider } from "./provider";
export { ProviderError } from "./provider";

let cachedProvider: StoryProvider | null = null;

/**
 * Single point of control for which implementation powers story/profile
 * lookups. Everything downstream (route handlers, `/profile/[username]`)
 * depends only on the `StoryProvider` interface — a future replacement
 * only needs to change this function.
 *
 * When `HIKERAPI_KEY` is configured, uses `HikerApiStoryProvider`, which
 * calls the HikerAPI vendor and can return actual Story media. Otherwise
 * falls back to `PublicWebStoryProvider` (profile metadata only, stories
 * always empty).
 */
export function getProvider(): StoryProvider {
  if (!cachedProvider) {
    cachedProvider = process.env.HIKERAPI_KEY
      ? new HikerApiStoryProvider()
      : new PublicWebStoryProvider();
  }
  return cachedProvider;
}
