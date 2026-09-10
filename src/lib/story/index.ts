import type { StoryProvider } from "./provider";
import { PublicWebStoryProvider } from "./public-web-provider";
import { HikerApiStoryProvider, getHikerApiKeys } from "./hikerapi-provider";

export type { StoryProvider } from "./provider";
export { ProviderError } from "./provider";

let cachedProvider: StoryProvider | null = null;

/**
 * Single point of control for which implementation powers story/profile
 * lookups. Everything downstream (route handlers, `/profile/[username]`)
 * depends only on the `StoryProvider` interface — a future replacement
 * only needs to change this function.
 *
 * When at least one HikerAPI key is configured (`HIKERAPI_KEY` and/or its
 * `HIKERAPI_Fallback_N_KEY` fallbacks), uses `HikerApiStoryProvider`,
 * which calls the HikerAPI vendor and can return actual Story media —
 * internally rotating through whichever of those keys still works.
 * Otherwise falls back to `PublicWebStoryProvider` (profile metadata
 * only, stories always empty).
 */
export function getProvider(): StoryProvider {
  if (!cachedProvider) {
    cachedProvider = getHikerApiKeys().length > 0
      ? new HikerApiStoryProvider()
      : new PublicWebStoryProvider();
  }
  return cachedProvider;
}
