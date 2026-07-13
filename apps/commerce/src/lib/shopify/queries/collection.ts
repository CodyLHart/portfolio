import { PRODUCT_SUMMARY_FRAGMENT } from "../fragments/product-summary";

export const COLLECTION_BY_HANDLE_QUERY = `#graphql
  ${PRODUCT_SUMMARY_FRAGMENT}

  query CollectionByHandle($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      id
      title
      handle
      description
      descriptionHtml
      image {
        url
        altText
        width
        height
      }
      products(first: $first) {
        nodes {
          ...ProductSummaryFragment
        }
      }
    }
  }
`;
