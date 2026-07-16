import { defineField, defineType } from "sanity";

export const splitCollectionHeroSection = defineType({
  name: "splitCollectionHeroSection",
  title: "Split collection hero",
  type: "object",
  fields: [
    defineField({
      name: "tiles",
      title: "Tiles",
      type: "array",
      of: [{ type: "promoCollectionTile" }],
      validation: (Rule) =>
        Rule.required().custom((tiles) =>
          Array.isArray(tiles) && tiles.length === 2
            ? true
            : "Split collection hero requires exactly two collection tiles.",
        ),
    }),
  ],
  preview: {
    select: {
      tiles: "tiles",
    },
    prepare: ({ tiles }) => ({
      title: "Split collection hero",
      subtitle: `${Array.isArray(tiles) ? tiles.length : 0} collection tile${
        Array.isArray(tiles) && tiles.length === 1 ? "" : "s"
      }`,
    }),
  },
});
