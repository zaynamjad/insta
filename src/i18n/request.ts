import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/* eslint-disable @typescript-eslint/no-explicit-any */
function deepMerge(base: Record<string, any>, overrides: Record<string, any>): Record<string, any> {
  const result = { ...base };
  for (const key of Object.keys(overrides)) {
    if (
      typeof result[key] === "object" && result[key] !== null &&
      typeof overrides[key] === "object" && overrides[key] !== null
    ) {
      result[key] = deepMerge(result[key], overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  }
  return result;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const userMessages = (await import(`../../messages/${locale}.json`)).default;

  // Load English as fallback so missing translations show English text
  // instead of raw key names (e.g. "featureCard3Title")
  const fallbackMessages =
    locale === "en"
      ? undefined
      : (await import("../../messages/en.json")).default;

  return {
    locale,
    messages: fallbackMessages
      ? deepMerge(fallbackMessages, userMessages)
      : userMessages,
  };
});
