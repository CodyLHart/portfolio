export type ShopifyProductSummary = {
  id: string;
  title: string;
  handle: string;
};

export type ProductsQueryResponse = {
  products: {
    nodes: ShopifyProductSummary[];
  };
};
