import "server-only";

import { getCollectionByHandle } from "./shopify/collections";
import type { ShopifyCollection } from "./shopify/types";
import type {
  FeaturedCollectionSectionContent,
  HeroSectionContent,
  HomePageContent,
  ImageTextSectionContent,
} from "../sanity/lib/types";

const MIN_FEATURED_PRODUCT_COUNT = 1;
const MAX_FEATURED_PRODUCT_COUNT = 8;

const clampProductCount = (productCount: number | null) => {
  const normalizedProductCount =
    typeof productCount === "number" && Number.isInteger(productCount)
      ? productCount
      : 4;

  return Math.min(
    MAX_FEATURED_PRODUCT_COUNT,
    Math.max(MIN_FEATURED_PRODUCT_COUNT, normalizedProductCount),
  );
};

export type ResolvedHeroSection = HeroSectionContent;

export type ResolvedFeaturedCollectionSection =
  FeaturedCollectionSectionContent & {
    collection: ShopifyCollection | null;
    productCount: number;
  };

export type ResolvedImageTextSection = ImageTextSectionContent;

export type ResolvedHomePageSection =
  | ResolvedHeroSection
  | ResolvedFeaturedCollectionSection
  | ResolvedImageTextSection;

export const resolveHomePageSections = async (
  homePage: HomePageContent,
): Promise<ResolvedHomePageSection[]> => {
  const sections = homePage.sections ?? [];

  return Promise.all(
    sections.map(async (section) => {
      if (section._type !== "featuredCollectionSection") {
        return section;
      }

      const productCount = clampProductCount(section.productCount);
      const collection = await getCollectionByHandle(
        section.collectionHandle,
        productCount,
      );

      return {
        ...section,
        collection,
        productCount,
      };
    }),
  );
};
