import { PRODUCT_SUMMARY_FRAGMENT } from "../fragments/product-summary";

export const PRODUCTS_QUERY = `#graphql
  ${PRODUCT_SUMMARY_FRAGMENT}

  query Products {
    products(first: 12) {
      nodes {
        ...ProductSummaryFragment
      }
    }
  }
`;
