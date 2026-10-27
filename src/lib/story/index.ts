import type { StoryProvider } from "./provider";
import { PublicWebStoryProvider } from "./public-web-provider";
import { HikerApiStoryProvider } from "./hikerapi-provider";
import { ScrapeCreatorsStoryProvider } from "./scrapecreators-provider";
import { InstaloaderStoryProvider } from "./instaloader-provider";
import { CallBudget } from "./call-budget";
import { getHybridConfig } from "./hybrid-config";
import { RoutedStoryProvider, type RoutingSnapshot, type RouteClients } from "./provider-router";
import { getAllApiKeys } from "./key-store";
import { getProviderSettings } from "./provider-settings";

export type { StoryProvider } from "./provider";
export { ProviderError } from "./provider";

// Stateless clients are shared; HikerAPI is rebuilt per request in `getProvider` because it carries that request's call budget.
const scrapeCreators = new ScrapeCreatorsStoryProvider();
const instaloader = new InstaloaderStoryProvider();
const publicWebProvider = new PublicWebStoryProvider();
let warnedInstaloaderConfig = false;

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
  const config = getHybridConfig();
  if (config.instaloader.state === "misconfigured" && !warnedInstaloaderConfig) {
    warnedInstaloaderConfig = true;
    console.error(`[story] Instaloader is enabled but misconfigured and will be skipped: ${config.instaloader.problem}`);
  }
  const snapshot: RoutingSnapshot = {
    settings,
    configured: { hikerapi: hikerKeys.length > 0, scrapecreators: scKeys.length > 0 },
    instaloaderReady: config.instaloader.state === "ready",
  };
  const clients: RouteClients = {
    hikerapi: new HikerApiStoryProvider(new CallBudget(config.hiker.maxCallsPerRequest, "HikerAPI")),
    scrapecreators: scrapeCreators,
    instaloader,
  };

  const anyUsable =
    (settings.enabled.hikerapi && snapshot.configured.hikerapi) ||
    (settings.enabled.scrapecreators && snapshot.configured.scrapecreators);
  return anyUsable ? new RoutedStoryProvider(snapshot, clients) : publicWebProvider;
}
