import { NextResponse } from "next/server";
import { toPublicCart } from "../../../components/cart/cart-drawer-types";
import { getCart } from "../../../lib/shopify/cart";
import { getCartCookie } from "../../../lib/shopify/cart-cookie";
import { getBuyerIp } from "../../../lib/shopify/request";
import type { PublicCartResponse } from "../../../components/cart/cart-drawer-types";

const CART_GID_PREFIX = "gid://shopify/Cart/";

const emptyCartResponse = () =>
  NextResponse.json<PublicCartResponse>(
    { cart: null },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );

export async function GET() {
  const cartId = await getCartCookie();

  if (!cartId || !cartId.startsWith(CART_GID_PREFIX)) {
    return emptyCartResponse();
  }

  try {
    const cart = await getCart(cartId, await getBuyerIp());

    if (!cart || cart.totalQuantity < 1) {
      return emptyCartResponse();
    }

    return NextResponse.json<PublicCartResponse>(
      { cart: toPublicCart(cart) },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return emptyCartResponse();
  }
}
