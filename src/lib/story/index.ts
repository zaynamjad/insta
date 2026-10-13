import type { StoryProvider } from "./provider";
import { PublicWebStoryProvider } from "./public-web-provider";
import { HikerApiStoryProvider } from "./hikerapi-provider";
import { ScrapeCreatorsStoryProvider } from "./scrapecreators-provider";
import { RoutedStoryProvider, type RoutingSnapshot } from "./provider-router";
import { getAllApiKeys, type ApiProviderId } from "./key-store";
import { getProviderSettings } from "./provider-settings";

export type { StoryProvider } from "./provider";
export { ProviderError } from "./provider";

const clients: Record<ApiProviderId, StoryProvider> = {
  hikerapi: new HikerApiStoryProvider(),
  scrapecreators: new ScrapeCreatorsStoryProvider(),
};
const publicWebProvider = new PublicWebStoryProvider();

/**
 * Single point of control for which implementation powers story/profile
 * lookups. Everything downstream (route handlers, `/profile/[username]`)
 * depends only on the `StoryProvider` interface.
 *
 * When at least one API provider is enabled and has a key — HikerAPI
 * and/or Scrape Creators, keys from the admin dashboard (Global Config)
 * and/or env vars — returns a `RoutedStoryProvider` that calls the
 * dashboard-selected Primary and fails over to the other provider on
 * retryable errors (see `provider-router.ts`). With only HikerAPI
 * configured that is exactly the previous HikerAPI-only behavior.
 * Otherwise falls back to `PublicWebStoryProvider` (profile metadata only,
 * stories always empty).
 *
 * Deliberately not cached: provider selection and keys are re-read every
 * call so a dashboard change applies to the next request, not the next
 * cold start. The returned provider holds the configuration read here, so
 * a request that makes several calls (e.g. lookupPosts) stays consistent
 * even if an admin saves new settings mid-request.
 */
export async function getProvider(): Promise<StoryProvider> {
  const [settings, hikerKeys, scKeys] = await Promise.all([
    getProviderSettings(),
    getAllApiKeys("hikerapi"),
    getAllApiKeys("scrapecreators"),
  ]);
  const snapshot: RoutingSnapshot = {
    settings,
    configured: { hikerapi: hikerKeys.length > 0, scrapecreators: scKeys.length > 0 },
  };

  const anyUsable =
    (settings.enabled.hikerapi && snapshot.configured.hikerapi) ||
    (settings.enabled.scrapecreators && snapshot.configured.scrapecreators);
  return anyUsable ? new RoutedStoryProvider(snapshot, clients) : publicWebProvider;
}
