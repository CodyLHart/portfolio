import { describe, expect, it, vi } from "vitest";
import {
  fallbackRetryDelaysMs,
  getShopifyRetryDelayMs,
  isRetryableShopifyStatus,
  maxShopifyAttempts,
  retryAfterCapMs,
} from "./retry-policy";

describe("Shopify retry policy", () => {
  it.each([429, 500, 502, 503, 504])("retries read-safe status %s", (status) => {
    expect(isRetryableShopifyStatus(status)).toBe(true);
  });

  it.each([400, 401, 403, 404, 422])("does not retry ordinary status %s", (status) => {
    expect(isRetryableShopifyStatus(status)).toBe(false);
  });

  it("bounds attempts and retry delays", () => {
    expect(maxShopifyAttempts).toBe(4);
    expect(getShopifyRetryDelayMs(1, null, 0)).toBe(fallbackRetryDelaysMs[0]);
    expect(getShopifyRetryDelayMs(2, null, 0)).toBe(fallbackRetryDelaysMs[1]);
    expect(getShopifyRetryDelayMs(99, null, 0)).toBe(fallbackRetryDelaysMs.at(-1));
  });

  it("honors and caps numeric Retry-After values", () => {
    expect(getShopifyRetryDelayMs(1, "0.5", 0)).toBe(500);
    expect(getShopifyRetryDelayMs(1, "60", 0)).toBe(retryAfterCapMs);
  });

  it("honors and caps date Retry-After values", () => {
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    expect(
      getShopifyRetryDelayMs(
        1,
        "Thu, 01 Jan 2026 00:00:01 GMT",
        0,
      ),
    ).toBe(1_000);
    expect(
      getShopifyRetryDelayMs(
        1,
        "Thu, 01 Jan 2026 00:10:00 GMT",
        0,
      ),
    ).toBe(retryAfterCapMs);

    vi.useRealTimers();
  });
});
