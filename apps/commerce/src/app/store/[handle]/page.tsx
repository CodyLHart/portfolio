import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "../../../components/navigation/BackButton";
import { ProductDetails } from "../../../components/product/ProductDetails";
import { getProductByHandle, getProducts } from "../../../lib/shopify/products";
import type {
  ShopifyImage,
  ShopifyProduct,
} from "../../../lib/shopify/types";
import productDetailsStyles from "../../../components/product/ProductDetails.module.css";
import styles from "./ProductPage.module.css";

type ProductPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

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

  return (
    <main className={styles.shell}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <BackButton />
      </nav>

      <article className={productDetailsStyles.detail}>
        <ProductDetails product={product} />
      </article>
    </main>
  );
}
