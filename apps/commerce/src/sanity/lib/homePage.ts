import "server-only";

import { sanityClient } from "./client";
import { HOME_PAGE_QUERY } from "./queries";
import type { HomePageContent } from "./types";

const sanityFetchOptions =
  process.env.NODE_ENV === "production"
    ? {
        next: {
          revalidate: 60,
        },
      }
    : {
        cache: "no-store" as const,
      };

export const getHomePageContent = async () =>
  sanityClient.fetch<HomePageContent | null>(
    HOME_PAGE_QUERY,
    {},
    sanityFetchOptions,
  );
