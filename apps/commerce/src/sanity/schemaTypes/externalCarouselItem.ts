import { defineField, defineType } from "sanity";

const isSecureExternalUrl = (href: string | undefined) => {
  const value = href?.trim();

  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:";
  } catch {
    return false;
  }
};

export const externalCarouselItem = defineType({
  name: "externalCarouselItem",
  title: "External carousel item",
  type: "object",
  initialValue: {
    openInNewTab: true,
  },
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
                value ? true : "Alt text is required for carousel images.",
              )
              .max(140),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "href",
      title: "Href",
      type: "url",
      description: "Use a secure external URL beginning with https://.",
      validation: (Rule) =>
        Rule.required().custom((value) =>
          isSecureExternalUrl(value)
            ? true
            : "Enter a secure external URL beginning with https://.",
        ),
    }),
    defineField({
      name: "openInNewTab",
      title: "Open in new tab",
      type: "boolean",
      description: "Recommended for links to external websites.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "subtitle",
      href: "href",
      media: "image",
    },
    prepare: ({ title, subtitle, href, media }) => ({
      title: title || "External item",
      subtitle: subtitle || href || "External carousel item",
      media,
    }),
  },
});
