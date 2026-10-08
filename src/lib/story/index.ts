import type { StoryProvider } from "./provider";
import { PublicWebStoryProvider } from "./public-web-provider";
import { HikerApiStoryProvider } from "./hikerapi-provider";
import { getAllHikerApiKeys } from "./key-store";

export type { StoryProvider } from "./provider";
export { ProviderError } from "./provider";

const hikerApiProvider = new HikerApiStoryProvider();
const publicWebProvider = new PublicWebStoryProvider();

/**
 * Single point of control for which implementation powers story/profile
 * lookups. Everything downstream (route handlers, `/profile/[username]`)
 * depends only on the `StoryProvider` interface — a future replacement
 * only needs to change this function.
 *
 * When at least one HikerAPI key is configured — in the admin dashboard
 * (Global Config) and/or via `HIKERAPI_KEY`/`HIKERAPI_Fallback_N_KEY` env
 * vars — uses `HikerApiStoryProvider`, which calls the HikerAPI vendor and
 * can return actual Story media, internally rotating through whichever
 * key still works. Otherwise falls back to `PublicWebStoryProvider`
 * (profile metadata only, stories always empty).
 *
 * Deliberately not caching this decision (unlike the old sync version,
 * which picked a provider once per server instance): keys added or
 * removed through the dashboard need to take effect on the next request,
 * not the next cold start. Both provider instances are plain and cheap to
 * hold onto, so only the *choice* between them is re-evaluated each call.
 */
export async function getProvider(): Promise<StoryProvider> {
  const keys = await getAllHikerApiKeys();
  return keys.length > 0 ? hikerApiProvider : publicWebProvider;
}
