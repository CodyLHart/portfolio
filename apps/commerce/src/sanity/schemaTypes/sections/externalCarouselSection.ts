import { defineField, defineType } from "sanity";

export const externalCarouselSection = defineType({
  name: "externalCarouselSection",
  title: "External carousel",
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
      description: "Add, remove, and drag external carousel cards.",
      of: [{ type: "externalCarouselItem" }],
      validation: (Rule) => Rule.required().min(1).max(30),
    }),
  ],
  preview: {
    select: {
      title: "heading",
      items: "items",
    },
    prepare: ({ title, items }) => ({
      title: title || "External carousel",
      subtitle: `${Array.isArray(items) ? items.length : 0} item${
        Array.isArray(items) && items.length === 1 ? "" : "s"
      }`,
    }),
  },
});
