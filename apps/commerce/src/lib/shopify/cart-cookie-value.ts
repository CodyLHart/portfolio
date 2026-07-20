export const SHOPIFY_CART_GID_PREFIX = "gid://shopify/Cart/";

export const decodeCartCookieValue = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value);
  } catch (error) {
    if (error instanceof URIError) {
      return null;
    }

    throw error;
  }
};

export const isShopifyCartGid = (
  value: string | null | undefined,
): value is string =>
  typeof value === "string" && value.startsWith(SHOPIFY_CART_GID_PREFIX);
