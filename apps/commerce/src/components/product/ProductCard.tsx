import Image from "next/image";
import Link from "next/link";
import { formatShopifyPrice } from "../../lib/shopify/format";
import type { ShopifyProductSummary } from "../../lib/shopify/types";
import styles from "./ProductCard.module.css";

export function ProductCard({
  product,
  showProductType = false,
}: {
  product: ShopifyProductSummary;
  showProductType?: boolean;
}) {
  const image = product.featuredImage;
  const price = formatShopifyPrice(product.priceRange.minVariantPrice);
  const imageWidth = image?.width && image.width > 0 ? image.width : 800;
  const imageHeight = image?.height && image.height > 0 ? image.height : 800;
  const productType = product.productType.trim();

  return (
    <li className={styles.card}>
      <Link href={`/store/${product.handle}`} className={styles.link}>
        <div className={styles.image}>
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.title}
              width={imageWidth}
              height={imageHeight}
              sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
            />
          ) : (
            <div className={styles.imageEmpty}>No image</div>
          )}
        </div>
        <div className={styles.content}>
          {showProductType && productType ? (
            <p className={styles.type}>{productType}</p>
          ) : null}
          <h2>{product.title}</h2>
          <p>{price}</p>
        </div>
      </Link>
    </li>
  );
}
