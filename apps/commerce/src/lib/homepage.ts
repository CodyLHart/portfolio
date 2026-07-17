import "server-only";

import { getCollectionByHandle } from "./shopify/collections";
import { getProductSummaryByHandle } from "./shopify/products";
import type { ShopifyCollection, ShopifyProductSummary } from "./shopify/types";
import type {
  CarouselItemContent,
  ExternalCarouselSectionContent,
  FeaturedCollectionSectionContent,
  HeroSectionContent,
  HomePageContent,
  ImageTextSectionContent,
  PromoCollectionTileContent,
  SplitCollectionHeroSectionContent,
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

export type ResolvedPromoCollectionTile = PromoCollectionTileContent & {
  collection: ShopifyCollection | null;
};

export type ResolvedSplitCollectionHeroSection =
  SplitCollectionHeroSectionContent & {
    tiles: ResolvedPromoCollectionTile[];
  };

export type ResolvedFeaturedCollectionSection =
  FeaturedCollectionSectionContent & {
    collection: ShopifyCollection | null;
    productCount: number;
  };

export type ResolvedImageTextSection = ImageTextSectionContent;

export type ResolvedExternalCarouselItem = Extract<
  CarouselItemContent,
  { _type: "externalCarouselItem" }
>;

export type ResolvedShopifyProductCarouselItem = Extract<
  CarouselItemContent,
  { _type: "shopifyProductCarouselItem" }
> & {
  productHandle: string;
  product: ShopifyProductSummary;
};

export type ResolvedCarouselItem =
  | ResolvedExternalCarouselItem
  | ResolvedShopifyProductCarouselItem;

export type ResolvedExternalCarouselSection = Omit<
  ExternalCarouselSectionContent,
  "items"
> & {
  items: ResolvedCarouselItem[];
};

export type ResolvedHomePageSection =
  | ResolvedHeroSection
  | ResolvedSplitCollectionHeroSection
  | ResolvedFeaturedCollectionSection
  | ResolvedImageTextSection
  | ResolvedExternalCarouselSection;

export const resolveHomePageSections = async (
  homePage: HomePageContent,
): Promise<ResolvedHomePageSection[]> => {
  const sections = homePage.sections ?? [];

  return Promise.all(
    sections.map(async (section) => {
      if (section._type === "splitCollectionHeroSection") {
        const tiles = section.tiles ?? [];
        const resolvedTiles = await Promise.all(
          tiles.map(async (tile) => ({
            ...tile,
            collection: await getCollectionByHandle(tile.collectionHandle, 1),
          })),
        );

        return {
          ...section,
          tiles: resolvedTiles,
        };
      }

      if (section._type === "featuredCollectionSection") {
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
      }

      if (section._type === "externalCarouselSection") {
        const resolvedItems: Array<ResolvedCarouselItem | null> = await Promise.all(
          (section.items ?? []).map(async (item) => {
            if (item._type === "externalCarouselItem") {
              return item;
            }

            if (item._type === "shopifyProductCarouselItem") {
              const productHandle = item.productHandle?.trim();

              if (!productHandle) {
                return null;
              }

              const product = await getProductSummaryByHandle(productHandle);

              if (!product) {
                return null;
              }

              return {
                ...item,
                productHandle,
                product,
              };
            }

            return null;
          }),
        );

        return {
          ...section,
          items: resolvedItems.filter(
            (item): item is ResolvedCarouselItem => Boolean(item),
          ),
        };
      }

      return section;
    }),
  );
};
