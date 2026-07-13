import { defineField, defineType } from "sanity";

export const featuredCollectionSection = defineType({
  name: "featuredCollectionSection",
  title: "Featured Shopify collection",
  type: "object",
  initialValue: {
    heading: "Featured products",
    productCount: 4,
    linkLabel: "View collection",
  },
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "collectionHandle",
      title: "Shopify collection handle",
      type: "string",
      description:
        "The Shopify collection URL handle, not the collection title.",
      validation: (Rule) =>
        Rule.required()
          .custom((value) =>
            typeof value === "string" && value.trim().length > 0
              ? true
              : "Enter a Shopify collection handle.",
          )
          .max(120),
    }),
    defineField({
      name: "productCount",
      title: "Product count",
      type: "number",
      validation: (Rule) => Rule.required().integer().min(1).max(8),
    }),
    defineField({
      name: "linkLabel",
      title: "Link label",
      type: "string",
      validation: (Rule) => Rule.max(40),
    }),
  ],
  preview: {
    select: {
      title: "heading",
      handle: "collectionHandle",
    },
    prepare: ({ title, handle }) => ({
      title: title || "Featured products",
      subtitle: handle
        ? `Featured Shopify collection: ${handle}`
        : "Featured Shopify collection",
    }),
  },
});
