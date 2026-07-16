import "server-only";

import { cookies } from "next/headers";

const CART_COOKIE = "shopify_cart_id";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const getCartCookie = async () => {
  const cookieStore = await cookies();
  const value = cookieStore.get(CART_COOKIE)?.value;

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

export const setCartCookie = async (cartId: string) => {
  const cookieStore = await cookies();

  cookieStore.set(CART_COOKIE, encodeURIComponent(cartId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
};

export const clearCartCookie = async () => {
  const cookieStore = await cookies();

  cookieStore.delete(CART_COOKIE);
};
