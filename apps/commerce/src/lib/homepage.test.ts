import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveHomePageSections } from "./homepage";
import { getCollectionByHandle } from "./shopify/collections";
import { getProductSummaryByHandle } from "./shopify/products";
import type { HomePageContent } from "../sanity/lib/types";

vi.mock("./shopify/collections", () => ({
  getCollectionByHandle: vi.fn(),
}));

vi.mock("./shopify/products", () => ({
  getProductSummaryByHandle: vi.fn(),
}));

const mockedGetCollectionByHandle = vi.mocked(getCollectionByHandle);
const mockedGetProductSummaryByHandle = vi.mocked(getProductSummaryByHandle);

const money = {
  amount: "25.00",
  currencyCode: "USD",
};

const product = {
  id: "gid://shopify/Product/1",
  title: "Shopify Product",
  handle: "shopify-product",
  productType: "Vinyl",
  availableForSale: true,
  featuredImage: {
    url: "https://cdn.shopify.com/product.jpg",
    altText: "Product",
    width: 800,
    height: 800,
  },
  priceRange: {
    minVariantPrice: money,
  },
};

const collection = {
  id: "gid://shopify/Collection/1",
  title: "Featured Collection",
  handle: "featured",
  description: "",
  descriptionHtml: "",
  image: null,
  products: {
    nodes: [product],
  },
};

const homePage = (sections: HomePageContent["sections"]): HomePageContent => ({
  eyebrow: null,
  heading: "Home",
  body: "Body",
  storeLinkLabel: "Store",
  heroImage: null,
  featuredCollectionHeading: null,
  featuredCollectionHandle: null,
  sections,
});

describe("resolveHomePageSections", () => {
  beforeEach(() => {
    mockedGetCollectionByHandle.mockReset();
    mockedGetProductSummaryByHandle.mockReset();
  });

  it("preserves mixed carousel order and product overrides", async () => {
    mockedGetProductSummaryByHandle.mockResolvedValue(product);

    const [section] = await resolveHomePageSections(
      homePage([
        {
          _key: "carousel",
          _type: "externalCarouselSection",
          heading: "Shop Music",
          items: [
            {
              _key: "external",
              _type: "externalCarouselItem",
              title: "External",
              subtitle: null,
              href: "https://example.com",
              openInNewTab: true,
              image: null,
            },
            {
              _key: "product",
              _type: "shopifyProductCarouselItem",
              productHandle: "shopify-product",
              customTitle: "Custom title",
              customSubtitle: "Custom subtitle",
              customImage: null,
            },
          ],
        },
      ]),
    );

    expect(section?._type).toBe("externalCarouselSection");
    if (section?._type !== "externalCarouselSection") {
      throw new Error("Unexpected section type.");
    }

    expect(section.items.map((item) => item._key)).toEqual([
      "external",
      "product",
    ]);
    expect(section.items[1]).toMatchObject({
      _type: "shopifyProductCarouselItem",
      productHandle: "shopify-product",
      customTitle: "Custom title",
      customSubtitle: "Custom subtitle",
      product,
    });
  });

  it("omits only missing or blank Shopify carousel products", async () => {
    mockedGetProductSummaryByHandle.mockResolvedValue(null);

    const [section] = await resolveHomePageSections(
      homePage([
        {
          _key: "carousel",
          _type: "externalCarouselSection",
          heading: "Shop Music",
          items: [
            {
              _key: "blank",
              _type: "shopifyProductCarouselItem",
              productHandle: " ",
              customTitle: null,
              customSubtitle: null,
              customImage: null,
            },
            {
              _key: "missing",
              _type: "shopifyProductCarouselItem",
              productHandle: "missing",
              customTitle: null,
              customSubtitle: null,
              customImage: null,
            },
            {
              _key: "external",
              _type: "externalCarouselItem",
              title: "External",
              subtitle: null,
              href: "https://example.com",
              openInNewTab: true,
              image: null,
            },
          ],
        },
      ]),
    );

    expect(section?._type).toBe("externalCarouselSection");
    if (section?._type !== "externalCarouselSection") {
      throw new Error("Unexpected section type.");
    }

    expect(section.items.map((item) => item._key)).toEqual(["external"]);
    expect(mockedGetProductSummaryByHandle).toHaveBeenCalledTimes(1);
    expect(mockedGetProductSummaryByHandle).toHaveBeenCalledWith("missing");
  });

  it("surfaces genuine Shopify product lookup failures", async () => {
    mockedGetProductSummaryByHandle.mockRejectedValue(
      new Error("Shopify unavailable"),
    );

    await expect(
      resolveHomePageSections(
        homePage([
          {
            _key: "carousel",
            _type: "externalCarouselSection",
            heading: "Shop Music",
            items: [
              {
                _key: "product",
                _type: "shopifyProductCarouselItem",
                productHandle: "shopify-product",
                customTitle: null,
                customSubtitle: null,
                customImage: null,
              },
            ],
          },
        ]),
      ),
    ).rejects.toThrow("Shopify unavailable");
  });

  it("preserves split hero tile order and unresolved collections", async () => {
    mockedGetCollectionByHandle
      .mockResolvedValueOnce(collection)
      .mockResolvedValueOnce(null);

    const [section] = await resolveHomePageSections(
      homePage([
        {
          _key: "split",
          _type: "splitCollectionHeroSection",
          tiles: [
            {
              _key: "tile-a",
              label: "A",
              collectionHandle: "featured",
              image: null,
            },
            {
              _key: "tile-b",
              label: "B",
              collectionHandle: "missing",
              image: null,
            },
          ],
        },
      ]),
    );

    expect(section?._type).toBe("splitCollectionHeroSection");
    if (!section || section._type !== "splitCollectionHeroSection") {
      throw new Error("Unexpected section type.");
    }

    const tiles = section.tiles as Array<{
      _key: string;
      collection: unknown;
    }>;

    expect(tiles.map((tile) => tile._key)).toEqual(["tile-a", "tile-b"]);
    expect(tiles.map((tile) => tile.collection)).toEqual([
      collection,
      null,
    ]);
  });
});
