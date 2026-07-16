import { defineField, defineType } from "sanity";

type NavigationItemValue = {
  href?: string;
};

const hasDuplicateHrefs = (items: NavigationItemValue[] | undefined) => {
  if (!items) {
    return false;
  }

  const hrefs = items
    .map((item) => item.href?.trim())
    .filter((href): href is string => Boolean(href));

  return new Set(hrefs).size !== hrefs.length;
};

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  initialValue: {
    siteTitle: "Cody Hart Store",
    announcementEnabled: false,
    copyrightText: "© Cody Hart",
  },
  fields: [
    defineField({
      name: "siteTitle",
      title: "Site title",
      type: "string",
      description: "Storefront brand label shown in the header.",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "logo",
      title: "Header logo",
      type: "image",
      description:
        "Optional logo that replaces the visible site title in the storefront header. Site title is used when no logo is published.",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          description:
            "Optional logo description. Site title will be used when left blank.",
          validation: (Rule) => Rule.max(120),
        }),
      ],
    }),
    defineField({
      name: "announcementEnabled",
      title: "Announcement enabled",
      type: "boolean",
    }),
    defineField({
      name: "announcementText",
      title: "Announcement text",
      type: "string",
      hidden: ({ parent }) => !parent?.announcementEnabled,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as
            | { announcementEnabled?: boolean }
            | undefined;

          return parent?.announcementEnabled && !value
            ? "Announcement text is required when the announcement is enabled."
            : true;
        }).max(180),
    }),
    defineField({
      name: "announcementLink",
      title: "Announcement link",
      type: "navigationItem",
      description: "Optional destination for the announcement.",
      hidden: ({ parent }) => !parent?.announcementEnabled,
    }),
    defineField({
      name: "headerLinks",
      title: "Header links",
      type: "array",
      description:
        "Links shown between the brand label and the system-controlled Cart link.",
      of: [{ type: "navigationItem" }],
      validation: (Rule) =>
        Rule.max(8).custom((items) =>
          hasDuplicateHrefs(items as NavigationItemValue[] | undefined)
            ? "Header links must not contain duplicate href values."
            : true,
        ),
    }),
    defineField({
      name: "footerHeading",
      title: "Footer heading",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "footerBody",
      title: "Footer body",
      type: "text",
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: "footerLinks",
      title: "Footer links",
      type: "array",
      of: [{ type: "navigationItem" }],
      validation: (Rule) =>
        Rule.max(12).custom((items) =>
          hasDuplicateHrefs(items as NavigationItemValue[] | undefined)
            ? "Footer links must not contain duplicate href values."
            : true,
        ),
    }),
    defineField({
      name: "copyrightText",
      title: "Copyright text",
      type: "string",
      description: "Displayed at the bottom of the storefront.",
      validation: (Rule) => Rule.max(120),
    }),
  ],
  preview: {
    select: {
      title: "siteTitle",
    },
  },
});
