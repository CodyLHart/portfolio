import type { ShopifyCart, ShopifyCartLine } from "../../lib/shopify/types";

export type PublicCartLine = Omit<ShopifyCartLine, "id"> & {
  lineId: ShopifyCartLine["id"];
};

export type PublicCart = Omit<ShopifyCart, "id" | "lines"> & {
  lines: {
    nodes: PublicCartLine[];
  };
};

export type PublicCartResponse = {
  cart: PublicCart | null;
};

export const toPublicCart = (cart: ShopifyCart): PublicCart => ({
  checkoutUrl: cart.checkoutUrl,
  totalQuantity: cart.totalQuantity,
  cost: cart.cost,
  lines: {
    nodes: cart.lines.nodes.map(({ id, ...line }) => ({
      ...line,
      lineId: id,
    })),
  },
});
