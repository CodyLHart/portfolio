import "server-only";

import { shopifyStorefrontRequest } from "./client";
import { COLLECTION_BY_HANDLE_QUERY } from "./queries/collection";
import { COLLECTIONS_QUERY } from "./queries/collections";
import type {
  CollectionByHandleQueryResponse,
  CollectionsQueryResponse,
} from "./types";

const DEFAULT_COLLECTION_PRODUCT_COUNT = 4;
const MIN_COLLECTION_PRODUCT_COUNT = 1;
const MAX_COLLECTION_PRODUCT_COUNT = 100;

const getValidProductCount = (first: number) => {
  if (
    !Number.isInteger(first) ||
    first < MIN_COLLECTION_PRODUCT_COUNT ||
    first > MAX_COLLECTION_PRODUCT_COUNT
  ) {
    throw new Error("Collection product count must be an integer from 1 to 100.");
  }

  return first;
};

export const getCollectionByHandle = async (
  handle: string | null | undefined,
  first = DEFAULT_COLLECTION_PRODUCT_COUNT,
) => {
  const trimmedHandle = handle?.trim();

  if (!trimmedHandle) {
    return null;
  }

  const productCount = getValidProductCount(first);

  const data = await shopifyStorefrontRequest<CollectionByHandleQueryResponse>({
    query: COLLECTION_BY_HANDLE_QUERY,
    variables: {
      handle: trimmedHandle,
      first: productCount,
    },
  });

  return data.collection;
};

export const getCollections = async () => {
  const data = await shopifyStorefrontRequest<CollectionsQueryResponse>({
    query: COLLECTIONS_QUERY,
  });

  return data.collections.nodes;
};
