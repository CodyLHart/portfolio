import { defineField, defineType } from "sanity";

export const shopifyProductCarouselItem = defineType({
  name: "shopifyProductCarouselItem",
  title: "Shopify product",
  type: "object",
  fields: [
    defineField({
      name: "productHandle",
      title: "Shopify product handle",
      type: "string",
      description:
        "Enter the product URL handle only, not the full URL or product title.",
      validation: (Rule) =>
        Rule.required().custom((value) =>
          typeof value === "string" && value.trim().length > 0
            ? true
            : "Enter a Shopify product handle.",
        ),
    }),
    defineField({
      name: "customTitle",
      title: "Custom title",
      type: "string",
      description: "Shopify's product title is used when this is empty.",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "customSubtitle",
      title: "Custom subtitle",
      type: "string",
      description: "Optional editorial supporting text for this carousel card.",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "customImage",
      title: "Custom image",
      type: "image",
      description:
        "Optional image for this carousel only. Shopify's featured image is used when this is empty.",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const parent = context.parent as { asset?: unknown } | undefined;

              return parent?.asset && !value
                ? "Alt text is required when a custom image is set."
                : true;
            }).max(140),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      customTitle: "customTitle",
      productHandle: "productHandle",
      media: "customImage",
    },
    prepare: ({ customTitle, productHandle, media }) => ({
      title: customTitle || productHandle || "Shopify product",
      subtitle: "Shopify product",
      media,
    }),
  },
});
