import "server-only";

import { sanityClient } from "./client";
import { HOME_PAGE_QUERY } from "./queries";
import type { HomePageContent } from "./types";

export const getHomePageContent = async () =>
  sanityClient.fetch<HomePageContent | null>(
    HOME_PAGE_QUERY,
    {},
    {
      next: {
        revalidate: 60,
      },
    },
  );
