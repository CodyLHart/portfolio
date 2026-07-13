import { PRODUCT_SUMMARY_FRAGMENT } from "../fragments/product-summary";

export const COLLECTION_BY_HANDLE_QUERY = `#graphql
  ${PRODUCT_SUMMARY_FRAGMENT}

  query CollectionByHandle($handle: String!) {
    collection(handle: $handle) {
      id
      title
      handle
      description
      products(first: 4) {
        nodes {
          ...ProductSummaryFragment
        }
      }
    }
  }
`;
