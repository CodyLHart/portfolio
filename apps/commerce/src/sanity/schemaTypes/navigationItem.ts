import { defineField, defineType } from "sanity";

const isValidNavigationHref = (href: string | undefined) => {
  const value = href?.trim();

  if (!value || /[\u0000-\u001F\u007F]/.test(value)) {
    return false;
  }

  if (value.includes("\\")) {
    return false;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return !value.includes("://");
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:";
  } catch {
    return false;
  }
};

export const navigationItem = defineType({
  name: "navigationItem",
  title: "Navigation item",
  type: "object",
  initialValue: {
    openInNewTab: false,
  },
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: "Visible link text shown to shoppers.",
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: "href",
      title: "Href",
      type: "string",
      description:
        "Use an internal path beginning with / or a secure external URL beginning with https://.",
      validation: (Rule) =>
        Rule.required().custom((value) =>
          isValidNavigationHref(value)
            ? true
            : "Enter an internal path like /store or a secure URL beginning with https://. Backslashes are not allowed.",
        ),
    }),
    defineField({
      name: "openInNewTab",
      title: "Open in new tab",
      type: "boolean",
      description: "Mainly intended for links to external websites.",
    }),
  ],
  preview: {
    select: {
      title: "label",
      subtitle: "href",
    },
  },
});
