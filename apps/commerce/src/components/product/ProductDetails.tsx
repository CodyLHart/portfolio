"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  addSelectedVariantToCart,
  type AddToCartState,
} from "../../app/cart/actions";
import { formatShopifyPrice } from "../../lib/shopify/format";
import type {
  ShopifyImage,
  ShopifyProductOption,
  ShopifyProductVariant,
} from "../../lib/shopify/types";
import {
  findFirstCompatibleVariant,
  findMatchingVariant,
  getCompatibleVariantsForOptionValue,
  getInitialVariant,
  getMeaningfulOptions,
  normalizeOptionName,
  optionSelectionLabel,
  selectedOptionsFromVariant,
  type SelectedOptions,
} from "../../lib/shopify/variants";

type ProductDetailsProduct = {
  title: string;
  vendor: string;
  productType: string;
  availableForSale: boolean;
  featuredImage: ShopifyImage | null;
  images: {
    nodes: ShopifyImage[];
  };
  options: ShopifyProductOption[];
  variants: {
    nodes: ShopifyProductVariant[];
  };
};

const isValidImageSize = (image: ShopifyImage) =>
  Boolean(image.width && image.width > 0 && image.height && image.height > 0);

const getUniqueImages = (product: ProductDetailsProduct) => {
  const images = product.featuredImage
    ? [product.featuredImage, ...product.images.nodes]
    : product.images.nodes;
  const uniqueImages = new Map<string, ShopifyImage>();

  images.forEach((image) => {
    if (!uniqueImages.has(image.url)) {
      uniqueImages.set(image.url, image);
    }
  });

  return Array.from(uniqueImages.values());
};

const getVariantImage = (
  variant: ShopifyProductVariant | null,
  images: ShopifyImage[],
) =>
  variant?.image
    ? (images.find((image) => image.url === variant.image?.url) ?? variant.image)
    : null;

const isCompareAtPriceVisible = (
  variant: ShopifyProductVariant | null,
) =>
  Boolean(
    variant?.compareAtPrice &&
      Number(variant.compareAtPrice.amount) > Number(variant.price.amount),
  );

const optionValueStatus = ({
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
  const hasCompatibleVariant = compatibleVariants.length > 0;
  const hasAvailableVariant = compatibleVariants.some(
    (variant) => variant.availableForSale,
  );

  return {
    disabled: !hasCompatibleVariant || !hasAvailableVariant,
    soldOut: hasCompatibleVariant && !hasAvailableVariant,
  };
};

function AddToCartButton({
  isAvailable,
  hasVariant,
}: {
  isAvailable: boolean;
  hasVariant: boolean;
}) {
  const { pending } = useFormStatus();
  const disabled = pending || !isAvailable || !hasVariant;

  return (
    <button className="add-to-cart-button" type="submit" disabled={disabled}>
      {pending ? "Adding..." : !isAvailable ? "Sold out" : "Add to cart"}
    </button>
  );
}

const initialAddToCartState: AddToCartState = {
  error: null,
};

export function ProductDetails({
  product,
  children,
}: {
  product: ProductDetailsProduct;
  children: ReactNode;
}) {
  const variants = product.variants.nodes;
  const initialVariant = useMemo(() => getInitialVariant(variants), [variants]);
  const images = useMemo(() => getUniqueImages(product), [product]);
  const initialImage = getVariantImage(initialVariant, images) ?? images[0] ?? null;
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>(() =>
    selectedOptionsFromVariant(initialVariant),
  );
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(
    initialImage?.url ?? null,
  );
  const [addToCartState, addToCartAction] = useActionState(
    addSelectedVariantToCart,
    initialAddToCartState,
  );
  const selectedVariant =
    findMatchingVariant(variants, selectedOptions) ?? initialVariant;
  const selectedVariantImage = getVariantImage(selectedVariant, images);
  const activeImage =
    images.find((image) => image.url === activeImageUrl) ??
    selectedVariantImage ??
    images[0] ??
    null;
  const displayOptions = getMeaningfulOptions(product.options);
  const compareAtPriceVisible = isCompareAtPriceVisible(selectedVariant);
  const hasMeaningfulVariants = displayOptions.length > 0;
  const availabilityText = hasMeaningfulVariants
    ? selectedVariant?.availableForSale
      ? "In stock"
      : "Sold out"
    : product.availableForSale
      ? "In stock"
      : "Sold out";
  const canSubmitSelectedVariant = Boolean(
    selectedVariant?.id && selectedVariant.availableForSale,
  );

  const handleOptionChange = (optionName: string, optionValue: string) => {
    const nextVariant = findFirstCompatibleVariant({
      variants,
      selectedOptions,
      optionName,
      optionValue,
    });

    if (!nextVariant) {
      return;
    }

    setSelectedOptions(selectedOptionsFromVariant(nextVariant));

    const nextImage = getVariantImage(nextVariant, images) ?? images[0] ?? null;
    setActiveImageUrl(nextImage?.url ?? null);
  };

  return (
    <>
      <section className="product-media" aria-label={`${product.title} images`}>
        {activeImage ? (
          <div className="product-primary-image">
            <Image
              src={activeImage.url}
              alt={activeImage.altText ?? product.title}
              width={isValidImageSize(activeImage) ? activeImage.width! : 1200}
              height={isValidImageSize(activeImage) ? activeImage.height! : 1200}
              sizes="(max-width: 900px) 100vw, 55vw"
              priority
            />
          </div>
        ) : (
          <div className="product-image-placeholder">No product image available</div>
        )}

        {images.length > 1 ? (
          <ul className="product-gallery" aria-label="Product image thumbnails">
            {images.map((image, index) => {
              const isSelected = image.url === activeImage?.url;

              return (
                <li key={image.url}>
                  <button
                    type="button"
                    className="product-thumbnail"
                    aria-label={`Show image ${index + 1} for ${product.title}`}
                    aria-pressed={isSelected}
                    onClick={() => setActiveImageUrl(image.url)}
                  >
                    <Image
                      src={image.url}
                      alt={image.altText ?? product.title}
                      width={isValidImageSize(image) ? image.width! : 600}
                      height={isValidImageSize(image) ? image.height! : 600}
                      sizes="(max-width: 900px) 33vw, 180px"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className="product-info" aria-labelledby="product-heading">
        <div className="product-heading-group">
          {product.vendor ? <p className="product-vendor">{product.vendor}</p> : null}
          <h1 id="product-heading">{product.title}</h1>
          {product.productType ? (
            <p className="product-type">{product.productType}</p>
          ) : null}
        </div>

        <div className="product-purchase-summary">
          <div className="product-price-group">
            {compareAtPriceVisible && selectedVariant?.compareAtPrice ? (
              <span className="product-compare-price">
                {formatShopifyPrice(selectedVariant.compareAtPrice)}
              </span>
            ) : null}
            <p className="product-price">
              {selectedVariant
                ? formatShopifyPrice(selectedVariant.price)
                : "Price unavailable"}
            </p>
            {compareAtPriceVisible ? (
              <p className="sale-context">Sale price</p>
            ) : null}
          </div>
          <p className="product-availability">{availabilityText}</p>
          {selectedVariant && selectedVariant.title.toLowerCase() !== "default title" ? (
            <p className="selected-variant">
              Selected variant: {selectedVariant.title}
            </p>
          ) : null}
        </div>

        <form action={addToCartAction} className="add-to-cart-form">
          <input type="hidden" name="variantId" value={selectedVariant?.id ?? ""} />
          <AddToCartButton
            isAvailable={canSubmitSelectedVariant}
            hasVariant={Boolean(selectedVariant)}
          />
          {addToCartState.error ? (
            <p className="form-error" role="alert">
              {addToCartState.error}
            </p>
          ) : null}
        </form>

        {displayOptions.length > 0 ? (
          <section className="product-options" aria-labelledby="options-heading">
            <h2 id="options-heading">Options</h2>
            <div className="option-fieldsets">
              {displayOptions.map((option) => (
                <fieldset className="option-fieldset" key={option.id}>
                  <legend>{option.name}</legend>
                  <div className="option-values">
                    {option.values.map((value) => {
                      const normalizedName = normalizeOptionName(option.name);
                      const isSelected = selectedOptions[normalizedName] === value;
                      const status = optionValueStatus({
                        variants,
                        selectedOptions,
                        optionName: option.name,
                        optionValue: value,
                      });

                      return (
                        <button
                          type="button"
                          key={value}
                          className="option-button"
                          aria-pressed={isSelected}
                          disabled={status.disabled}
                          onClick={() => handleOptionChange(option.name, value)}
                        >
                          <span>{value}</span>
                          {status.soldOut ? (
                            <span className="option-status">Sold out</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          </section>
        ) : null}

        {hasMeaningfulVariants && variants.length > 0 ? (
          <section className="product-variants" aria-labelledby="variants-heading">
            <h2 id="variants-heading">Variants</h2>
            <ul>
              {variants.map((variant) => (
                <li key={variant.id}>
                  <span>{variant.title}</span>
                  <span>{optionSelectionLabel(variant.selectedOptions)}</span>
                  <span>{formatShopifyPrice(variant.price)}</span>
                  <span>{variant.availableForSale ? "Available" : "Sold out"}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {children}
      </section>
    </>
  );
}
