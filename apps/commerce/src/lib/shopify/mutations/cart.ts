import { CART_FRAGMENT } from "../fragments/cart";

const CART_USER_ERRORS = `#graphql
  userErrors {
    field
    message
    code
  }
`;

export const CART_CREATE_MUTATION = `#graphql
  ${CART_FRAGMENT}

  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        ...CartFragment
      }
      ${CART_USER_ERRORS}
    }
  }
`;

export const CART_LINES_ADD_MUTATION = `#graphql
  ${CART_FRAGMENT}

  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFragment
      }
      ${CART_USER_ERRORS}
    }
  }
`;

export const CART_LINES_UPDATE_MUTATION = `#graphql
  ${CART_FRAGMENT}

  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFragment
      }
      ${CART_USER_ERRORS}
    }
  }
`;

export const CART_LINES_REMOVE_MUTATION = `#graphql
  ${CART_FRAGMENT}

  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFragment
      }
      ${CART_USER_ERRORS}
    }
  }
`;
