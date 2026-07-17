import { defineField, defineType } from "sanity";

export const externalCarouselSection = defineType({
  name: "externalCarouselSection",
  title: "Mixed carousel",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      description:
        "Mix and reorder external link cards and Shopify product cards in one carousel. External items navigate to other websites; Shopify products navigate to product pages in this store.",
      of: [{ type: "externalCarouselItem" }, { type: "shopifyProductCarouselItem" }],
      validation: (Rule) => Rule.required().min(1).max(30),
    }),
  ],
  preview: {
    select: {
      title: "heading",
      items: "items",
    },
    prepare: ({ title, items }) => ({
      title: title || "Mixed carousel",
      subtitle: `${Array.isArray(items) ? items.length : 0} item${
        Array.isArray(items) && items.length === 1 ? "" : "s"
      }`,
    }),
  },
});
