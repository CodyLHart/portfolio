import "server-only";

import { sanityClient } from "./client";
import { SITE_SETTINGS_QUERY } from "./queries";
import type { SiteSettingsContent } from "./types";

export const getSiteSettings = async () =>
  sanityClient.fetch<SiteSettingsContent | null>(
    SITE_SETTINGS_QUERY,
    {},
    {
      next: {
        revalidate: 60,
      },
    },
  );
