import "server-only";

import { cache } from "react";
import { shopifyStorefrontRequest } from "./client";
import {
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_SUMMARY_BY_HANDLE_QUERY,
} from "./queries/product";
import { PRODUCTS_QUERY } from "./queries/products";
import type {
  ProductByHandleQueryResponse,
  ProductSummaryByHandleQueryResponse,
  ProductsQueryResponse,
} from "./types";

export const getProducts = cache(async () => {
  const data = await shopifyStorefrontRequest<ProductsQueryResponse>({
    query: PRODUCTS_QUERY,
    retryMode: "read",
  });

  return data.products.nodes;
});

export const getProductByHandle = cache(async (handle: string) => {
  const data = await shopifyStorefrontRequest<ProductByHandleQueryResponse>({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: {
      handle,
    },
    retryMode: "read",
  });

  return data.product;
});

export const getProductSummaryByHandle = cache(async (handle: string) => {
  const data = await shopifyStorefrontRequest<ProductSummaryByHandleQueryResponse>({
    query: PRODUCT_SUMMARY_BY_HANDLE_QUERY,
    variables: {
      handle,
    },
    retryMode: "read",
  });

  return data.product;
});
