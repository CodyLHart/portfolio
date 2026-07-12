import "server-only";

import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
} from "./mutations/cart";
import { CART_QUERY } from "./queries/cart";
import { shopifyStorefrontRequest } from "./client";
import type {
  CartCreateResponse,
  CartLinesAddResponse,
  CartLinesRemoveResponse,
  CartLinesUpdateResponse,
  CartQueryResponse,
  ShopifyCart,
  ShopifyCartUserError,
} from "./types";

export class ShopifyCartUserErrorMessage extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyCartUserErrorMessage";
  }
}

const assertPositiveQuantity = (quantity: number) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Cart quantity must be a positive integer.");
  }
};

const assertEditableQuantity = (quantity: number) => {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error("Cart quantity must be between 1 and 99.");
  }
};

const assertNoCartUserErrors = (errors: ShopifyCartUserError[]) => {
  if (errors.length > 0) {
    throw new ShopifyCartUserErrorMessage(
      errors.map((error) => error.message).join(" "),
    );
  }
};

const assertCart = (cart: ShopifyCart | null) => {
  if (!cart) {
    throw new Error("Shopify did not return a cart.");
  }

  return cart;
};

export const getCart = async (cartId: string, buyerIp?: string) => {
  const data = await shopifyStorefrontRequest<CartQueryResponse>({
    query: CART_QUERY,
    variables: {
      id: cartId,
    },
    buyerIp,
  });

  return data.cart;
};

export const createCartWithLine = async (
  variantId: string,
  quantity: number,
  buyerIp?: string,
) => {
  assertPositiveQuantity(quantity);

  const data = await shopifyStorefrontRequest<CartCreateResponse>({
    query: CART_CREATE_MUTATION,
    variables: {
      input: {
        lines: [
          {
            merchandiseId: variantId,
            quantity,
          },
        ],
      },
    },
    buyerIp,
  });

  assertNoCartUserErrors(data.cartCreate.userErrors);

  return assertCart(data.cartCreate.cart);
};

export const addLineToCart = async (
  cartId: string,
  variantId: string,
  quantity: number,
  buyerIp?: string,
) => {
  assertPositiveQuantity(quantity);

  const data = await shopifyStorefrontRequest<CartLinesAddResponse>({
    query: CART_LINES_ADD_MUTATION,
    variables: {
      cartId,
      lines: [
        {
          merchandiseId: variantId,
          quantity,
        },
      ],
    },
    buyerIp,
  });

  assertNoCartUserErrors(data.cartLinesAdd.userErrors);

  return assertCart(data.cartLinesAdd.cart);
};

export const updateCartLine = async (
  cartId: string,
  lineId: string,
  quantity: number,
  buyerIp?: string,
) => {
  assertEditableQuantity(quantity);

  const data = await shopifyStorefrontRequest<CartLinesUpdateResponse>({
    query: CART_LINES_UPDATE_MUTATION,
    variables: {
      cartId,
      lines: [
        {
          id: lineId,
          quantity,
        },
      ],
    },
    buyerIp,
  });

  assertNoCartUserErrors(data.cartLinesUpdate.userErrors);

  return assertCart(data.cartLinesUpdate.cart);
};

export const removeCartLine = async (
  cartId: string,
  lineId: string,
  buyerIp?: string,
) => {
  const data = await shopifyStorefrontRequest<CartLinesRemoveResponse>({
    query: CART_LINES_REMOVE_MUTATION,
    variables: {
      cartId,
      lineIds: [lineId],
    },
    buyerIp,
  });

  assertNoCartUserErrors(data.cartLinesRemove.userErrors);

  return assertCart(data.cartLinesRemove.cart);
};
