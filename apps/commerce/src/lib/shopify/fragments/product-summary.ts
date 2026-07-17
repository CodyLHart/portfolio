export const PRODUCT_SUMMARY_FRAGMENT = `#graphql
  fragment ProductSummaryFragment on Product {
    id
    title
    handle
    availableForSale
    featuredImage {
      url
      altText
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
`;
