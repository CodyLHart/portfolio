import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatShopifyPrice, formatShopifyPriceRange } from "../../../lib/shopify/format";
import { getProductByHandle, getProducts } from "../../../lib/shopify/products";
import type {
  ShopifyImage,
  ShopifyProduct,
  ShopifyProductOption,
  ShopifyProductVariant,
} from "../../../lib/shopify/types";

type ProductPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

const isValidImageSize = (image: ShopifyImage) =>
  Boolean(image.width && image.width > 0 && image.height && image.height > 0);

const getImageKey = (image: ShopifyImage) => image.url;

const getProductImages = (product: ShopifyProduct) => {
  const images = product.featuredImage
    ? [product.featuredImage, ...product.images.nodes]
    : product.images.nodes;
  const uniqueImages = new Map<string, ShopifyImage>();

  images.forEach((image) => {
    if (!uniqueImages.has(getImageKey(image))) {
      uniqueImages.set(getImageKey(image), image);
    }
  });

  return Array.from(uniqueImages.values());
};

const isDefaultOnlyOption = (options: ShopifyProductOption[]) =>
  options.length === 1 &&
  options[0]?.name.toLowerCase() === "title" &&
  options[0]?.values.length === 1 &&
  options[0]?.values[0]?.toLowerCase() === "default title";

const getDisplayOptions = (options: ShopifyProductOption[]) =>
  isDefaultOnlyOption(options)
    ? []
    : options.map((option) => ({
        ...option,
        values: Array.from(new Set(option.values)),
      }));

const shouldShowVariants = (variants: ShopifyProductVariant[]) =>
  variants.length > 1 ||
  variants.some((variant) => variant.title.toLowerCase() !== "default title");

const shortenDescription = (description: string) => {
  const normalized = description.trim().replace(/\s+/g, " ");

  return normalized.length > 160
    ? `${normalized.slice(0, 157).trim()}...`
    : normalized;
};

export async function generateStaticParams() {
  const products = await getProducts();

  return products.map((product) => ({
    handle: product.handle,
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    return {
      title: "Product not found | Commerce",
    };
  }

  const images = getProductImages(product);
  const primaryImage = images[0];

  return {
    title: product.seo.title ?? product.title,
    description:
      product.seo.description ??
      shortenDescription(product.description || product.title),
    openGraph: primaryImage
      ? {
          images: [
            {
              url: primaryImage.url,
              alt: primaryImage.altText ?? product.title,
              width: primaryImage.width ?? undefined,
              height: primaryImage.height ?? undefined,
            },
          ],
        }
      : undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    notFound();
  }

  const images = getProductImages(product);
  const [primaryImage, ...galleryImages] = images;
  const price = formatShopifyPriceRange({
    min: product.priceRange.minVariantPrice,
    max: product.priceRange.maxVariantPrice,
  });
  const displayOptions = getDisplayOptions(product.options);
  const variants = product.variants.nodes;

  return (
    <main className="product-detail-shell">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/store">Back to store</Link>
      </nav>

      <article className="product-detail">
        <section className="product-media" aria-label={`${product.title} images`}>
          {primaryImage ? (
            <div className="product-primary-image">
              <Image
                src={primaryImage.url}
                alt={primaryImage.altText ?? product.title}
                width={isValidImageSize(primaryImage) ? primaryImage.width! : 1200}
                height={
                  isValidImageSize(primaryImage) ? primaryImage.height! : 1200
                }
                sizes="(max-width: 900px) 100vw, 55vw"
                priority
              />
            </div>
          ) : (
            <div className="product-image-placeholder">No product image available</div>
          )}

          {galleryImages.length > 0 ? (
            <ul className="product-gallery">
              {galleryImages.map((image) => (
                <li key={image.url}>
                  <Image
                    src={image.url}
                    alt={image.altText ?? product.title}
                    width={isValidImageSize(image) ? image.width! : 600}
                    height={isValidImageSize(image) ? image.height! : 600}
                    sizes="(max-width: 900px) 33vw, 180px"
                  />
                </li>
              ))}
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

          <p className="product-price">{price}</p>
          <p className="product-availability">
            {product.availableForSale ? "Available for sale" : "Not currently available"}
          </p>

          <section className="product-description" aria-labelledby="description-heading">
            <h2 id="description-heading">Description</h2>
            {product.descriptionHtml ? (
              <div
                className="product-rich-text"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            ) : (
              <p>{product.description || "No product description is available."}</p>
            )}
          </section>

          {displayOptions.length > 0 ? (
            <section className="product-options" aria-labelledby="options-heading">
              <h2 id="options-heading">Options</h2>
              <dl>
                {displayOptions.map((option) => (
                  <div key={option.id}>
                    <dt>{option.name}</dt>
                    <dd>{option.values.join(", ")}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {shouldShowVariants(variants) ? (
            <section className="product-variants" aria-labelledby="variants-heading">
              <h2 id="variants-heading">Variants</h2>
              <ul>
                {variants.map((variant) => (
                  <li key={variant.id}>
                    <span>{variant.title}</span>
                    <span>{formatShopifyPrice(variant.price)}</span>
                    <span>
                      {variant.availableForSale ? "Available" : "Unavailable"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>
      </article>
    </main>
  );
}
