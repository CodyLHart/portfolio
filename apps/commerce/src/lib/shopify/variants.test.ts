import { describe, expect, it } from "vitest";
import type {
  ShopifyProductOption,
  ShopifyProductVariant,
} from "./types";
import {
  findFirstCompatibleVariant,
  findMatchingVariant,
  getInitialVariant,
  getMeaningfulOptions,
  isDefaultOnlyOption,
  normalizeOptionName,
  selectedOptionsFromVariant,
} from "./variants";

const money = { amount: "10.00", currencyCode: "USD" };

const variant = ({
  id,
  availableForSale = true,
  selectedOptions,
}: {
  id: string;
  availableForSale?: boolean;
  selectedOptions: Array<{ name: string; value: string }>;
}): ShopifyProductVariant => ({
  id,
  title: selectedOptions.map((option) => option.value).join(" / "),
  availableForSale,
  selectedOptions,
  price: money,
  compareAtPrice: null,
  image: null,
});

describe("variant helpers", () => {
  it("normalizes option names and hides Shopify default-title-only options", () => {
    const options: ShopifyProductOption[] = [
      {
        id: "option-title",
        name: " Title ",
        values: ["Default Title"],
      },
    ];

    expect(normalizeOptionName(" Size ")).toBe("size");
    expect(isDefaultOnlyOption(options)).toBe(true);
    expect(getMeaningfulOptions(options)).toEqual([]);
  });

  it("deduplicates meaningful option values", () => {
    expect(
      getMeaningfulOptions([
        {
          id: "option-size",
          name: "Size",
          values: ["Small", "Small", "Medium"],
        },
      ]),
    ).toEqual([
      {
        id: "option-size",
        name: "Size",
        values: ["Small", "Medium"],
      },
    ]);
  });

  it("finds exact one-, two-, and three-option matches", () => {
    const variants = [
      variant({
        id: "small",
        selectedOptions: [{ name: "Size", value: "Small" }],
      }),
      variant({
        id: "black-small",
        selectedOptions: [
          { name: "Color", value: "Black" },
          { name: "Size", value: "Small" },
        ],
      }),
      variant({
        id: "black-small-cotton",
        selectedOptions: [
          { name: "Color", value: "Black" },
          { name: "Size", value: "Small" },
          { name: "Material", value: "Cotton" },
        ],
      }),
    ];

    expect(findMatchingVariant(variants, { size: "Small" })?.id).toBe("small");
    expect(
      findMatchingVariant(variants, { color: "Black", size: "Small" })?.id,
    ).toBe("black-small");
    expect(
      findMatchingVariant(variants, {
        color: "Black",
        size: "Small",
        material: "Cotton",
      })?.id,
    ).toBe("black-small-cotton");
  });

  it("returns null when selected options are incomplete or impossible", () => {
    const variants = [
      variant({
        id: "black-small",
        selectedOptions: [
          { name: "Color", value: "Black" },
          { name: "Size", value: "Small" },
        ],
      }),
    ];

    expect(findMatchingVariant(variants, { color: "Black" })).toBeNull();
    expect(
      findMatchingVariant(variants, { color: "White", size: "Small" }),
    ).toBeNull();
  });

  it("does not reject unavailable exact matches", () => {
    const unavailable = variant({
      id: "sold-out",
      availableForSale: false,
      selectedOptions: [{ name: "Size", value: "Small" }],
    });

    expect(findMatchingVariant([unavailable], { size: "Small" })).toBe(
      unavailable,
    );
  });

  it("uses first available variant, then first variant, as initial fallback", () => {
    const soldOut = variant({
      id: "sold-out",
      availableForSale: false,
      selectedOptions: [{ name: "Size", value: "Small" }],
    });
    const available = variant({
      id: "available",
      selectedOptions: [{ name: "Size", value: "Medium" }],
    });

    expect(getInitialVariant([soldOut, available])).toBe(available);
    expect(getInitialVariant([soldOut])).toBe(soldOut);
    expect(getInitialVariant([])).toBeNull();
  });

  it("selects first compatible available variant for a proposed option", () => {
    const variants = [
      variant({
        id: "black-small-sold-out",
        availableForSale: false,
        selectedOptions: [
          { name: "Color", value: "Black" },
          { name: "Size", value: "Small" },
        ],
      }),
      variant({
        id: "black-medium",
        selectedOptions: [
          { name: "Color", value: "Black" },
          { name: "Size", value: "Medium" },
        ],
      }),
    ];

    expect(
      findFirstCompatibleVariant({
        variants,
        selectedOptions: { color: "Black" },
        optionName: "Size",
        optionValue: "Small",
      })?.id,
    ).toBe("black-small-sold-out");
    expect(
      findFirstCompatibleVariant({
        variants,
        selectedOptions: { color: "Black" },
        optionName: "Size",
        optionValue: "Medium",
      })?.id,
    ).toBe("black-medium");
  });

  it("returns selected options from a variant without requiring an image", () => {
    expect(
      selectedOptionsFromVariant(
        variant({
          id: "no-image",
          selectedOptions: [{ name: "Color", value: "Black" }],
        }),
      ),
    ).toEqual({ color: "Black" });
    expect(selectedOptionsFromVariant(null)).toEqual({});
  });
});
