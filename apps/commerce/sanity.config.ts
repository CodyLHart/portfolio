"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import {
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";

export default defineConfig({
  name: "cody-hart-store",
  title: "Cody Hart Store CMS",
  basePath: "/studio",
  projectId: sanityProjectId,
  dataset: sanityDataset,
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: sanityApiVersion }),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    actions: (previousActions, context) =>
      context.schemaType === "homePage" || context.schemaType === "siteSettings"
        ? previousActions.filter((action) => action.action !== "duplicate")
        : previousActions,
    newDocumentOptions: (previousOptions) =>
      previousOptions.filter(
        (option) =>
          option.templateId !== "homePage" &&
          option.templateId !== "siteSettings",
      ),
  },
});
