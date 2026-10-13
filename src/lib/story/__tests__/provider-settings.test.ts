import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROVIDER_SETTINGS,
  otherProvider,
  parseProviderSettings,
  planProviders,
  validateProviderSettings,
  type ApiProviderSettings,
} from "../provider-settings";

const both = { hikerapi: true, scrapecreators: true };
const all = () => true;
const settings = (over: Partial<ApiProviderSettings> = {}): ApiProviderSettings => ({
  ...DEFAULT_PROVIDER_SETTINGS,
  primary: "hikerapi",
  enabled: { ...DEFAULT_PROVIDER_SETTINGS.enabled },
  ...over,
});

describe("parseProviderSettings", () => {
  it("defaults to Scrape Creators primary (HikerAPI fallback) with failover on", () => {
    expect(parseProviderSettings(undefined)).toEqual(DEFAULT_PROVIDER_SETTINGS);
    expect(parseProviderSettings({ primary: "bogus", enabled: "x" })).toEqual(DEFAULT_PROVIDER_SETTINGS);
  });
  it("keeps valid stored values", () => {
    const s = parseProviderSettings({
      primary: "scrapecreators",
      fallbackEnabled: false,
      enabled: { hikerapi: false, scrapecreators: true },
    });
    expect(s).toEqual({ primary: "scrapecreators", fallbackEnabled: false, enabled: { hikerapi: false, scrapecreators: true } });
  });
});

describe("otherProvider", () => {
  it("never returns the same provider, so roles can't collide", () => {
    expect(otherProvider("hikerapi")).toBe("scrapecreators");
    expect(otherProvider("scrapecreators")).toBe("hikerapi");
  });
});

describe("planProviders", () => {
  it("A: HikerAPI primary, Scrape Creators fallback", () => {
    expect(planProviders(settings(), both, all)).toEqual(["hikerapi", "scrapecreators"]);
  });
  it("B: Scrape Creators primary, HikerAPI fallback", () => {
    expect(planProviders(settings({ primary: "scrapecreators" }), both, all)).toEqual(["scrapecreators", "hikerapi"]);
  });
  it("omits the fallback when failover is off", () => {
    expect(planProviders(settings({ fallbackEnabled: false }), both, all)).toEqual(["hikerapi"]);
  });
  it("omits a disabled fallback", () => {
    const s = settings({ enabled: { hikerapi: true, scrapecreators: false } });
    expect(planProviders(s, both, all)).toEqual(["hikerapi"]);
  });
  it("preserves HikerAPI-only behavior when Scrape Creators has no credentials", () => {
    expect(planProviders(settings(), { hikerapi: true, scrapecreators: false }, all)).toEqual(["hikerapi"]);
  });
  it("uses the other provider when the primary has no credentials", () => {
    expect(planProviders(settings(), { hikerapi: false, scrapecreators: true }, all)).toEqual(["scrapecreators"]);
  });
  it("skips a provider that doesn't support the operation", () => {
    const noSc = (id: string) => id !== "scrapecreators";
    expect(planProviders(settings({ primary: "scrapecreators" }), both, noSc)).toEqual(["hikerapi"]);
    expect(planProviders(settings({ primary: "scrapecreators", fallbackEnabled: false }), both, noSc)).toEqual(["hikerapi"]);
  });
  it("is empty when nothing usable supports the operation", () => {
    const s = settings({ primary: "scrapecreators", enabled: { hikerapi: false, scrapecreators: true } });
    expect(planProviders(s, both, (id) => id !== "scrapecreators")).toEqual([]);
  });
});

describe("validateProviderSettings", () => {
  it("accepts both configurations when both are configured and enabled", () => {
    expect(validateProviderSettings(settings(), both)).toBeNull();
    expect(validateProviderSettings(settings({ primary: "scrapecreators" }), both)).toBeNull();
  });
  it("rejects a disabled primary", () => {
    const s = settings({ primary: "scrapecreators", enabled: { hikerapi: true, scrapecreators: false } });
    expect(validateProviderSettings(s, both)).toMatch(/disabled/);
  });
  it("rejects an unconfigured primary", () => {
    expect(validateProviderSettings(settings({ primary: "scrapecreators" }), { hikerapi: true, scrapecreators: false })).toMatch(/no API key/);
  });
});
