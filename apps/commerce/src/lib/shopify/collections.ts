import "server-only";

import { shopifyStorefrontRequest } from "./client";
import { COLLECTION_BY_HANDLE_QUERY } from "./queries/collection";
import type { CollectionByHandleQueryResponse } from "./types";

export const getCollectionByHandle = async (handle: string | null | undefined) => {
  const trimmedHandle = handle?.trim();

  if (!trimmedHandle) {
    return null;
  }

  const data = await shopifyStorefrontRequest<CollectionByHandleQueryResponse>({
    query: COLLECTION_BY_HANDLE_QUERY,
    variables: {
      handle: trimmedHandle,
    },
  });

  return data.collection;
};
