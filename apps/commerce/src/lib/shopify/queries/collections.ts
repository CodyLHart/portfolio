export const COLLECTIONS_QUERY = `#graphql
  query Collections {
    collections(first: 50) {
      nodes {
        title
        handle
      }
    }
  }
`;
