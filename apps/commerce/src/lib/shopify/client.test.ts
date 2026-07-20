import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadClient = async () => {
  vi.stubEnv("SHOPIFY_STORE_DOMAIN", "example.myshopify.com");
  vi.stubEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN", "test-token");
  vi.stubEnv("SHOPIFY_STOREFRONT_API_VERSION", "2026-01");
  vi.resetModules();

  return import("./client");
};

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    status: init?.status ?? 200,
  });

describe("shopifyStorefrontRequest retry behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("retries read requests on retryable status and returns the successful response", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({}, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    vi.stubGlobal("fetch", fetchMock);
    const { shopifyStorefrontRequest } = await loadClient();
    const request = shopifyStorefrontRequest<{ ok: boolean }>({
      query: "query Test { shop { name } }",
      retryMode: "read",
    });

    await vi.advanceTimersByTimeAsync(400);

    await expect(request).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries transient network failures for read requests", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error("socket closed"))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    vi.stubGlobal("fetch", fetchMock);
    const { shopifyStorefrontRequest } = await loadClient();
    const request = shopifyStorefrontRequest<{ ok: boolean }>({
      query: "query Test { shop { name } }",
      retryMode: "read",
    });

    await vi.advanceTimersByTimeAsync(400);

    await expect(request).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable read statuses", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({}, { status: 400 }));

    vi.stubGlobal("fetch", fetchMock);
    const { shopifyStorefrontRequest } = await loadClient();

    await expect(
      shopifyStorefrontRequest({
        query: "query Test { shop { name } }",
        retryMode: "read",
      }),
    ).rejects.toThrow("Shopify request failed with status 400");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry mutations automatically", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({}, { status: 503 }));

    vi.stubGlobal("fetch", fetchMock);
    const { shopifyStorefrontRequest } = await loadClient();

    await expect(
      shopifyStorefrontRequest({
        query: "mutation Test { cartCreate { cart { id } } }",
      }),
    ).rejects.toThrow("Shopify request failed with status 503");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops after the bounded retry count", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({}, { status: 504 }));

    vi.stubGlobal("fetch", fetchMock);
    const { shopifyStorefrontRequest } = await loadClient();
    const request = shopifyStorefrontRequest({
      query: "query Test { shop { name } }",
      retryMode: "read",
    });
    const expectation = expect(request).rejects.toThrow(
      "Shopify request failed with status 504 after 4 attempts.",
    );

    await vi.advanceTimersByTimeAsync(400 + 900 + 1_800);

    await expectation;
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
