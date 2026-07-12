import { CART_FRAGMENT } from "../fragments/cart";

export const CART_QUERY = `#graphql
  ${CART_FRAGMENT}

  query Cart($id: ID!) {
    cart(id: $id) {
      ...CartFragment
    }
  }
`;
