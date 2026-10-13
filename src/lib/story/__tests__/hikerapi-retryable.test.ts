import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HikerApiStoryProvider } from "../hikerapi-provider";

vi.mock("../key-store", () => ({ getAllHikerApiKeys: vi.fn(async () => ["hk_1"]) }));
vi.mock("../rate-limit", () => ({ checkOutboundRateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }) }));

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

// Failover eligibility is decided by `ProviderError.retryable`; these pin
// down how the existing HikerAPI client classifies each failure.
describe("HikerApiStoryProvider failure classification", () => {
  const hiker = new HikerApiStoryProvider();

  it.each([
    [429, true],
    [402, true],
    [500, true],
    [503, true],
    [401, false],
    [403, false],
    [400, false],
  ])("HTTP %i → retryable=%s", async (status, retryable) => {
    fetchMock.mockResolvedValue(new Response("", { status }));
    await expect(hiker.getBasicProfile("alice")).rejects.toMatchObject({ retryable });
  });

  it("treats a network failure as retryable", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(hiker.getBasicProfile("alice")).rejects.toMatchObject({ retryable: true });
  });

  it("treats an abort/timeout as retryable with the timeout code", async () => {
    const abort = Object.assign(new Error("aborted"), { name: "AbortError" });
    fetchMock.mockRejectedValue(abort);
    await expect(hiker.getBasicProfile("alice")).rejects.toMatchObject({ code: "UPSTREAM_TIMEOUT", retryable: true });
  });

  it("does not treat an invalid username as retryable", async () => {
    await expect(hiker.getBasicProfile("bad name!!")).rejects.toMatchObject({ retryable: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
