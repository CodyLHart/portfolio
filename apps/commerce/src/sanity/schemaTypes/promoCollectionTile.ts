import { defineField, defineType } from "sanity";

export const promoCollectionTile = defineType({
  name: "promoCollectionTile",
  title: "Promotional collection tile",
  type: "object",
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (Rule) =>
            Rule.required()
              .custom((value) =>
                value ? true : "Alt text is required for collection tile images.",
              )
              .max(140),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "collectionHandle",
      title: "Shopify collection handle",
      type: "string",
      description:
        "Use the Shopify collection URL handle, not the collection display title.",
      validation: (Rule) =>
        Rule.required()
          .custom((value) =>
            typeof value === "string" && value.trim().length > 0
              ? true
              : "Enter a Shopify collection handle.",
          )
          .max(120),
    }),
  ],
  preview: {
    select: {
      title: "label",
      subtitle: "collectionHandle",
      media: "image",
    },
  },
});
