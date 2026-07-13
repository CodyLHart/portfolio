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

export default defineConfig({
  name: "cody-hart-store",
  title: "Cody Hart Store CMS",
  basePath: "/studio",
  projectId: sanityProjectId,
  dataset: sanityDataset,
  plugins: [structureTool(), visionTool({ defaultApiVersion: sanityApiVersion })],
  schema: {
    types: schemaTypes,
  },
});
