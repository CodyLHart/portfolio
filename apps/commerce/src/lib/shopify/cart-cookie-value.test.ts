import { describe, expect, it } from "vitest";
import {
  decodeCartCookieValue,
  isShopifyCartGid,
  SHOPIFY_CART_GID_PREFIX,
} from "./cart-cookie-value";

describe("cart cookie value helpers", () => {
  const cartId = `${SHOPIFY_CART_GID_PREFIX}abc123`;

  it("decodes valid Shopify cart IDs", () => {
    expect(decodeCartCookieValue(cartId)).toBe(cartId);
    expect(decodeCartCookieValue(encodeURIComponent(cartId))).toBe(cartId);
  });

  it("returns null for missing, empty, or malformed values", () => {
    expect(decodeCartCookieValue(null)).toBeNull();
    expect(decodeCartCookieValue(undefined)).toBeNull();
    expect(decodeCartCookieValue("")).toBeNull();
    expect(decodeCartCookieValue("%E0%A4%A")).toBeNull();
  });

  it("validates only Shopify cart GIDs", () => {
    expect(isShopifyCartGid(cartId)).toBe(true);
    expect(isShopifyCartGid("gid://shopify/ProductVariant/123")).toBe(false);
    expect(isShopifyCartGid("forged-cart-id")).toBe(false);
    expect(isShopifyCartGid(` ${cartId}`)).toBe(false);
    expect(isShopifyCartGid(encodeURIComponent(cartId))).toBe(false);
  });
});
