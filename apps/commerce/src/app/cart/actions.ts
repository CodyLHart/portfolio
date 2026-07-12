"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addLineToCart,
  createCartWithLine,
  getCart,
  removeCartLine,
  ShopifyCartUserErrorMessage,
  updateCartLine,
} from "../../lib/shopify/cart";
import { getCartCookie, setCartCookie } from "../../lib/shopify/cart-cookie";
import { getBuyerIp } from "../../lib/shopify/request";
import type { ShopifyCart } from "../../lib/shopify/types";

export type AddToCartState = {
  error: string | null;
};

export type CartLineActionState = {
  error: string | null;
  success: boolean;
};

const PRODUCT_VARIANT_GID_PREFIX = "gid://shopify/ProductVariant/";
const CART_LINE_GID_PREFIX = "gid://shopify/CartLine/";
const MIN_CART_QUANTITY = 1;
const MAX_CART_QUANTITY = 99;

const cartLineActionSuccess: CartLineActionState = {
  error: null,
  success: true,
};

const getVariantId = (formData: FormData) => {
  const variantId = formData.get("variantId");

  if (
    typeof variantId !== "string" ||
    !variantId.startsWith(PRODUCT_VARIANT_GID_PREFIX)
  ) {
    return null;
  }

  return variantId;
};

const getCartLineId = (formData: FormData) => {
  const lineId = formData.get("lineId");

  if (
    typeof lineId !== "string" ||
    !lineId.startsWith(CART_LINE_GID_PREFIX)
  ) {
    return null;
  }

  return lineId;
};

const getRequestedQuantity = (formData: FormData) => {
  const rawQuantity = formData.get("quantity");

  if (typeof rawQuantity !== "string" || !/^\d{1,2}$/.test(rawQuantity)) {
    return null;
  }

  const quantity = Number(rawQuantity);

  return quantity >= MIN_CART_QUANTITY && quantity <= MAX_CART_QUANTITY
    ? quantity
    : null;
};

const findCartLine = (cart: ShopifyCart, lineId: string) =>
  cart.lines.nodes.find((line) => line.id === lineId) ?? null;

const getUsableCart = async (cartId: string, buyerIp?: string) => {
  try {
    return await getCart(cartId, buyerIp);
  } catch {
    return null;
  }
};

export const addSelectedVariantToCart = async (
  _previousState: AddToCartState,
  formData: FormData,
): Promise<AddToCartState> => {
  const variantId = getVariantId(formData);

  if (!variantId) {
    return {
      error: "Select an available product option before adding it to cart.",
    };
  }

  const buyerIp = await getBuyerIp();
  const cartId = await getCartCookie();
  let shouldRedirectToCart = false;

  try {
    if (cartId) {
      let existingCart = null;

      try {
        existingCart = await getCart(cartId, buyerIp);
      } catch {
        existingCart = null;
      }

      if (existingCart) {
        const updatedCart = await addLineToCart(
          existingCart.id,
          variantId,
          1,
          buyerIp,
        );

        if (updatedCart.totalQuantity <= existingCart.totalQuantity) {
          return {
            error: "Shopify could not add this item to cart.",
          };
        }

        revalidatePath("/cart");
        shouldRedirectToCart = true;
      }
    }

    if (!shouldRedirectToCart) {
      const cart = await createCartWithLine(variantId, 1, buyerIp);

      if (cart.totalQuantity < 1) {
        return {
          error: "Shopify could not add this item to cart.",
        };
      }

      await setCartCookie(cart.id);
      revalidatePath("/cart");
      shouldRedirectToCart = true;
    }
  } catch (error) {
    if (error instanceof ShopifyCartUserErrorMessage) {
      return {
        error: error.message || "Shopify could not add this item to cart.",
      };
    }

    throw error;
  }

  if (shouldRedirectToCart) {
    redirect("/cart");
  }

  return {
    error: "Shopify could not add this item to cart.",
  };
};

export const changeCartLineQuantity = async (
  _previousState: CartLineActionState,
  formData: FormData,
): Promise<CartLineActionState> => {
  const lineId = getCartLineId(formData);
  const quantity = getRequestedQuantity(formData);

  if (!lineId || !quantity) {
    return {
      error: "Enter a valid cart quantity.",
      success: false,
    };
  }

  const buyerIp = await getBuyerIp();
  const cartId = await getCartCookie();

  if (!cartId) {
    return {
      error: "Your cart could not be found.",
      success: false,
    };
  }

  try {
    const cart = await getUsableCart(cartId, buyerIp);

    if (!cart || !findCartLine(cart, lineId)) {
      return {
        error: "That cart line could not be found.",
        success: false,
      };
    }

    await updateCartLine(cart.id, lineId, quantity, buyerIp);
    revalidatePath("/cart");

    return cartLineActionSuccess;
  } catch (error) {
    if (error instanceof ShopifyCartUserErrorMessage) {
      return {
        error: error.message || "Shopify could not update this cart line.",
        success: false,
      };
    }

    throw error;
  }
};

export const removeCartLineFromCart = async (
  _previousState: CartLineActionState,
  formData: FormData,
): Promise<CartLineActionState> => {
  const lineId = getCartLineId(formData);

  if (!lineId) {
    return {
      error: "That cart line could not be found.",
      success: false,
    };
  }

  const buyerIp = await getBuyerIp();
  const cartId = await getCartCookie();

  if (!cartId) {
    return {
      error: "Your cart could not be found.",
      success: false,
    };
  }

  try {
    const cart = await getUsableCart(cartId, buyerIp);

    if (!cart || !findCartLine(cart, lineId)) {
      return {
        error: "That cart line could not be found.",
        success: false,
      };
    }

    await removeCartLine(cart.id, lineId, buyerIp);
    revalidatePath("/cart");

    return cartLineActionSuccess;
  } catch (error) {
    if (error instanceof ShopifyCartUserErrorMessage) {
      return {
        error: error.message || "Shopify could not remove this cart line.",
        success: false,
      };
    }

    throw error;
  }
};
