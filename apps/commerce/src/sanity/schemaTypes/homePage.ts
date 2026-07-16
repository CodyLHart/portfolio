import { defineField, defineType } from "sanity";

type SectionLike = {
  _type?: string;
};

const heroSectionTypes = new Set(["heroSection", "splitCollectionHeroSection"]);

const hasSections = (document: unknown) =>
  typeof document === "object" &&
  document !== null &&
  "sections" in document &&
  Array.isArray(document.sections) &&
  document.sections.length > 0;

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
      hidden: ({ document }) => hasSections(document),
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      description: "The main headline for the commerce homepage.",
      hidden: ({ document }) => hasSections(document),
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "text",
      description: "A short sentence or paragraph below the heading.",
      hidden: ({ document }) => hasSections(document),
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: "storeLinkLabel",
      title: "Store link label",
      type: "string",
      description: "Text for the homepage link that sends shoppers to the store.",
      hidden: ({ document }) => hasSections(document),
      validation: (Rule) => Rule.required().max(40),
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      description: "Optional image shown in the homepage hero beside the copy.",
      hidden: ({ document }) => hasSections(document),
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
      hidden: ({ document }) => hasSections(document),
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "featuredCollectionHandle",
      title: "Shopify collection handle",
      type: "string",
      description:
        "The Shopify collection URL handle, not the display title. Example: boot-gun",
      hidden: ({ document }) => hasSections(document),
      validation: (Rule) =>
        Rule.custom((value) =>
          typeof value === "string" && value.trim().length === 0
            ? "Remove this value or enter a Shopify collection handle."
            : true,
        ).max(120),
    }),
    defineField({
      name: "sections",
      title: "Page sections",
      type: "array",
      description:
        "Add, remove, and drag sections to control the public homepage order.",
      of: [
        { type: "heroSection" },
        { type: "splitCollectionHeroSection" },
        { type: "featuredCollectionSection" },
        { type: "imageTextSection" },
        { type: "externalCarouselSection" },
      ],
      validation: (Rule) =>
        Rule.max(12).custom((sections) => {
          if (!sections) {
            return true;
          }

          if (!Array.isArray(sections)) {
            return "Page sections must be an ordered list.";
          }

          if (sections.length === 0) {
            return true;
          }

          const sectionItems = sections as SectionLike[];
          const heroSections = sectionItems.filter((section) =>
            section?._type ? heroSectionTypes.has(section._type) : false,
          );

          if (
            !sectionItems[0]?._type ||
            !heroSectionTypes.has(sectionItems[0]._type)
          ) {
            return "The first page section must be a Hero or Split collection hero.";
          }

          if (heroSections.length > 1) {
            return "Only one hero-style section is allowed.";
          }

          return true;
        }),
    }),
  ],
  preview: {
    select: {
      title: "heading",
    },
  },
});
