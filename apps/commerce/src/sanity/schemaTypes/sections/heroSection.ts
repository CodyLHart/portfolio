import { defineField, defineType } from "sanity";

const isValidInternalPath = (value: string | undefined) => {
  if (!value) {
    return true;
  }

  return value.startsWith("/") && !value.startsWith("//") && !value.includes("://");
};

export const heroSection = defineType({
  name: "heroSection",
  title: "Hero",
  type: "object",
  initialValue: {
    ctaLabel: "View store",
    ctaPath: "/store",
    imagePosition: "right",
  },
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      description: "The main homepage heading.",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "text",
      validation: (Rule) => Rule.required().max(500),
    }),
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
            Rule.custom((value, context) =>
              context.parent ? value ? true : "Alt text is required for hero images." : true,
            ).max(140),
        }),
      ],
    }),
    defineField({
      name: "ctaLabel",
      title: "CTA label",
      type: "string",
      validation: (Rule) => Rule.max(40),
    }),
    defineField({
      name: "ctaPath",
      title: "CTA path",
      type: "string",
      description: "Internal path beginning with one slash, for example /store.",
      validation: (Rule) =>
        Rule.custom((value) =>
          isValidInternalPath(value)
            ? true
            : "Enter an internal path beginning with one slash.",
        ),
    }),
    defineField({
      name: "imagePosition",
      title: "Image position",
      type: "string",
      options: {
        layout: "radio",
        list: [
          { title: "Left", value: "left" },
          { title: "Right", value: "right" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "heading",
      media: "image",
    },
    prepare: ({ title, media }) => ({
      title: title || "Untitled hero",
      subtitle: "Hero",
      media,
    }),
  },
});
