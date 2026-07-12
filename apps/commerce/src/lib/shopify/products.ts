import { shopifyStorefrontRequest } from "./client";
import { PRODUCT_BY_HANDLE_QUERY } from "./queries/product";
import { PRODUCTS_QUERY } from "./queries/products";
import type {
  ProductByHandleQueryResponse,
  ProductsQueryResponse,
} from "./types";

export const getProducts = async () => {
  const data = await shopifyStorefrontRequest<ProductsQueryResponse>({
    query: PRODUCTS_QUERY,
  });

  return data.products.nodes;
};

export const getProductByHandle = async (handle: string) => {
  const data = await shopifyStorefrontRequest<ProductByHandleQueryResponse>({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: {
      handle,
    },
  });

  return data.product;
};
