import { defineField, defineType } from "sanity";

export const homePage = defineType({
  name: "homePage",
  title: "Homepage",
  type: "document",
  initialValue: {
    storeLinkLabel: "View store",
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
  ],
  preview: {
    select: {
      title: "heading",
    },
  },
});
