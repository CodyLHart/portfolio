import { defineField, defineType } from "sanity";

export const homePage = defineType({
  name: "homePage",
  title: "Homepage",
  type: "document",
  initialValue: {
    storeLinkLabel: "View store",
    featuredCollectionHeading: "Featured products",
  },
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      description: "Short optional label shown above the homepage heading.",
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      description: "The main headline for the commerce homepage.",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "text",
      description: "A short sentence or paragraph below the heading.",
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: "storeLinkLabel",
      title: "Store link label",
      type: "string",
      description: "Text for the homepage link that sends shoppers to the store.",
      validation: (Rule) => Rule.required().max(40),
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      description: "Optional image shown in the homepage hero beside the copy.",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          description: "Describe the image for shoppers using screen readers.",
          validation: (Rule) =>
            Rule.custom((value, context) =>
              context.parent ? value ? true : "Alt text is required for hero images." : true,
            ).max(140),
        }),
      ],
    }),
    defineField({
      name: "featuredCollectionHeading",
      title: "Featured collection heading",
      type: "string",
      description: "Heading shown above the Shopify featured products section.",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "featuredCollectionHandle",
      title: "Shopify collection handle",
      type: "string",
      description:
        "The Shopify collection URL handle, not the display title. Example: boot-gun",
      validation: (Rule) =>
        Rule.custom((value) =>
          typeof value === "string" && value.trim().length === 0
            ? "Remove this value or enter a Shopify collection handle."
            : true,
        ).max(120),
    }),
  ],
  preview: {
    select: {
      title: "heading",
    },
  },
});
