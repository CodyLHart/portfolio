import type { StructureResolver } from "sanity/structure";

const SINGLETON_DOCUMENT_TYPES = ["homePage", "siteSettings"];

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Homepage")
        .id("homePage")
        .child(
          S.document()
            .schemaType("homePage")
            .documentId("homePage")
            .title("Homepage"),
        ),
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId("siteSettings")
            .title("Site settings"),
        ),
      ...S.documentTypeListItems().filter(
        (listItem) => !SINGLETON_DOCUMENT_TYPES.includes(listItem.getId() ?? ""),
      ),
    ]);
