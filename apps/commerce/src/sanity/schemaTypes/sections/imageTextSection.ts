import { defineField, defineType } from "sanity";

const isValidInternalPath = (value: string | undefined) => {
  if (!value) {
    return true;
  }

  return value.startsWith("/") && !value.startsWith("//") && !value.includes("://");
};

export const imageTextSection = defineType({
  name: "imageTextSection",
  title: "Image with text",
  type: "object",
  initialValue: {
    imagePosition: "left",
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
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "text",
      validation: (Rule) => Rule.required().max(600),
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
            Rule.required()
              .custom((value) =>
                value ? true : "Alt text is required for this image.",
              )
              .max(140),
        }),
      ],
      validation: (Rule) => Rule.required(),
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
    defineField({
      name: "linkLabel",
      title: "Link label",
      type: "string",
      validation: (Rule) => Rule.max(40),
    }),
    defineField({
      name: "linkPath",
      title: "Link path",
      type: "string",
      description: "Internal path beginning with one slash, for example /store.",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as
            | { linkLabel?: string; linkPath?: string }
            | undefined;
          const label = parent?.linkLabel?.trim();
          const path = value?.trim();

          if (label && !path) {
            return "Add a link path or remove the link label.";
          }

          if (!label && path) {
            return "Add a link label or remove the link path.";
          }

          return isValidInternalPath(path)
            ? true
            : "Enter an internal path beginning with one slash.";
        }),
    }),
  ],
  preview: {
    select: {
      title: "heading",
      media: "image",
    },
    prepare: ({ title, media }) => ({
      title: title || "Untitled image with text",
      subtitle: "Image with text",
      media,
    }),
  },
});
