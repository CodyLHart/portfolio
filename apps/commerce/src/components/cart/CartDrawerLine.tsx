"use client";

import Image from "next/image";
import Link from "next/link";
import { CartLineControls } from "./CartLineControls";
import type { PublicCartLine } from "./cart-drawer-types";
import { formatShopifyPrice } from "../../lib/shopify/format";
import type { ShopifyImage } from "../../lib/shopify/types";
import styles from "./CartDrawerLine.module.css";

const isValidImageSize = (image: ShopifyImage) =>
  Boolean(image.width && image.width > 0 && image.height && image.height > 0);

const isDefaultVariant = (line: PublicCartLine) =>
  line.merchandise.title.toLowerCase() === "default title" ||
  (line.merchandise.selectedOptions.length === 1 &&
    line.merchandise.selectedOptions[0]?.name.toLowerCase() === "title" &&
    line.merchandise.selectedOptions[0]?.value.toLowerCase() === "default title");

const getVariantLabel = (line: PublicCartLine) =>
  isDefaultVariant(line)
    ? null
    : line.merchandise.selectedOptions
        .map((option) => `${option.name}: ${option.value}`)
        .join(", ") || line.merchandise.title;

export function CartDrawerLine({
  line,
  onMutationSuccess,
}: {
  line: PublicCartLine;
  onMutationSuccess: () => Promise<void> | void;
}) {
  const image = line.merchandise.image;
  const variantLabel = getVariantLabel(line);
  const productTitle = line.merchandise.product.title;

  return (
    <li className={styles.line}>
      <div className={styles.image}>
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? productTitle}
            width={isValidImageSize(image) ? image.width! : 300}
            height={isValidImageSize(image) ? image.height! : 300}
            sizes="(max-width: 360px) 96px, 112px"
          />
        ) : (
          <div className={styles.imagePlaceholder}>No image</div>
        )}
      </div>
      <div className={styles.details}>
        <div className={styles.top}>
          <Link
            aria-label={`${productTitle}, quantity ${line.quantity}`}
            href={`/store/${line.merchandise.product.handle}`}
            title={productTitle}
          >
            {productTitle}
            <span aria-hidden="true" className={styles.quantity}>
              ({line.quantity})
            </span>
          </Link>
          <p className={styles.total}>
            {formatShopifyPrice(line.cost.totalAmount)}
          </p>
        </div>
        {variantLabel ? <p className={styles.meta}>{variantLabel}</p> : null}
        <div className={styles.actions}>
          <CartLineControls
            lineId={line.lineId}
            onSuccess={onMutationSuccess}
            productTitle={productTitle}
            quantity={line.quantity}
          />
        </div>
      </div>
    </li>
  );
}
