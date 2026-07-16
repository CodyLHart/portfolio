import type {
  ShopifyProductOption,
  ShopifyProductVariant,
} from "./types";

export type SelectedOptions = Record<string, string>;

export const normalizeOptionName = (name: string) =>
  name.trim().toLowerCase();

export const isDefaultOnlyOption = (options: ShopifyProductOption[]) =>
  options.length === 1 &&
  normalizeOptionName(options[0]?.name ?? "") === "title" &&
  options[0]?.values.length === 1 &&
  (options[0]?.values[0] ?? "").trim().toLowerCase() === "default title";

export const getMeaningfulOptions = (options: ShopifyProductOption[]) =>
  isDefaultOnlyOption(options)
    ? []
    : options.map((option) => ({
        ...option,
        values: Array.from(new Set(option.values)),
      }));

export const selectedOptionsFromVariant = (
  variant: ShopifyProductVariant | null,
) =>
  (variant?.selectedOptions ?? []).reduce<SelectedOptions>(
    (selectedOptions, option) => ({
      ...selectedOptions,
      [normalizeOptionName(option.name)]: option.value,
    }),
    {},
  );

export const variantMatchesSelectedOptions = (
  variant: ShopifyProductVariant,
  selectedOptions: SelectedOptions,
) =>
  Object.entries(selectedOptions).every(([selectedName, selectedValue]) =>
    variant.selectedOptions.some(
      (option) =>
        normalizeOptionName(option.name) === selectedName &&
        option.value === selectedValue,
    ),
  );

export const findMatchingVariant = (
  variants: ShopifyProductVariant[],
  selectedOptions: SelectedOptions,
) =>
  variants.find(
    (variant) =>
      Object.keys(selectedOptions).length === variant.selectedOptions.length &&
      variantMatchesSelectedOptions(variant, selectedOptions),
  ) ?? null;

export const getInitialVariant = (variants: ShopifyProductVariant[]) =>
  variants.find((variant) => variant.availableForSale) ?? variants[0] ?? null;

export const getCompatibleVariantsForOptionValue = ({
  variants,
  selectedOptions,
  optionName,
  optionValue,
}: {
  variants: ShopifyProductVariant[];
  selectedOptions: SelectedOptions;
  optionName: string;
  optionValue: string;
}) => {
  const normalizedOptionName = normalizeOptionName(optionName);
  const proposedSelection = {
    ...selectedOptions,
    [normalizedOptionName]: optionValue,
  };

  return variants.filter((variant) =>
    variantMatchesSelectedOptions(variant, proposedSelection),
  );
};

export const findFirstCompatibleVariant = ({
  variants,
  selectedOptions,
  optionName,
  optionValue,
}: {
  variants: ShopifyProductVariant[];
  selectedOptions: SelectedOptions;
  optionName: string;
  optionValue: string;
}) => {
  const compatibleVariants = getCompatibleVariantsForOptionValue({
    variants,
    selectedOptions,
    optionName,
    optionValue,
  });

  return (
    compatibleVariants.find((variant) => variant.availableForSale) ??
    compatibleVariants[0] ??
    null
  );
};
