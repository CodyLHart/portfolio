import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "../../../../components/product/ProductCard";
import {
  getCollectionByHandle,
  getCollections,
} from "../../../../lib/shopify/collections";
import type { ShopifyCollection, ShopifyImage } from "../../../../lib/shopify/types";

type CollectionPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

const COLLECTION_PRODUCT_COUNT = 24;

const isValidImageSize = (image: ShopifyImage) =>
  Boolean(image.width && image.width > 0 && image.height && image.height > 0);

const shortenDescription = (description: string) => {
  const normalized = description
    .replace(/<[^>]*>/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  return normalized.length > 160
    ? `${normalized.slice(0, 157).trim()}...`
    : normalized;
};

const CollectionImage = ({ collection }: { collection: ShopifyCollection }) => {
  const image = collection.image;

  if (!image) {
    return null;
  }

  return (
    <div className="collection-image">
      <Image
        src={image.url}
        alt={image.altText ?? collection.title}
        width={isValidImageSize(image) ? image.width! : 1200}
        height={isValidImageSize(image) ? image.height! : 800}
        sizes="(max-width: 900px) 100vw, 44vw"
        priority
      />
    </div>
  );
};

export async function generateStaticParams() {
  const collections = await getCollections();

  return collections.map((collection) => ({
    handle: collection.handle,
  }));
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { handle } = await params;
  const collection = await getCollectionByHandle(handle, COLLECTION_PRODUCT_COUNT);

  if (!collection) {
    return {
      title: "Collection not found | Commerce",
    };
  }

  const descriptionSource =
    collection.description || collection.descriptionHtml || collection.title;
  const description = shortenDescription(descriptionSource);

  return {
    title: `${collection.title} | Commerce`,
    description,
    openGraph: collection.image
      ? {
          images: [
            {
              url: collection.image.url,
              alt: collection.image.altText ?? collection.title,
              width: collection.image.width ?? undefined,
              height: collection.image.height ?? undefined,
            },
          ],
        }
      : undefined,
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { handle } = await params;
  const collection = await getCollectionByHandle(handle, COLLECTION_PRODUCT_COUNT);

  if (!collection) {
    notFound();
  }

  const products = collection.products.nodes;

  return (
    <main className="collection-shell">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/store">Back to store</Link>
      </nav>

      <header className={collection.image ? "collection-header has-image" : "collection-header"}>
        <div className="collection-heading">
          <h1>{collection.title}</h1>
          {collection.descriptionHtml ? (
            <div
              className="collection-rich-text"
              dangerouslySetInnerHTML={{ __html: collection.descriptionHtml }}
            />
          ) : collection.description ? (
            <p>{collection.description}</p>
          ) : null}
        </div>
        <CollectionImage collection={collection} />
      </header>

      {products.length > 0 ? (
        <section aria-label={`${collection.title} products`}>
          <ul className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ul>
        </section>
      ) : (
        <p className="store-empty">
          No published products were returned for this collection.
        </p>
      )}
    </main>
  );
}
