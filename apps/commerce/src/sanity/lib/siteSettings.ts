import "server-only";

import { sanityClient } from "./client";
import { SITE_SETTINGS_QUERY } from "./queries";
import type { SiteSettingsContent } from "./types";

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

export const getSiteSettings = async () =>
  sanityClient.fetch<SiteSettingsContent | null>(
    SITE_SETTINGS_QUERY,
    {},
    sanityFetchOptions,
  );
