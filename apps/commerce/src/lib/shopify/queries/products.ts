export const PRODUCTS_QUERY = `#graphql
  query Products {
    products(first: 5) {
      nodes {
        id
        title
        handle
      }
    }
  }
`;
