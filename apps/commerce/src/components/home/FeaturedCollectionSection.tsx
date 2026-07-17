import Link from "next/link";
import { ProductCard } from "../product/ProductCard";
import productCardStyles from "../product/ProductCard.module.css";
import type { ResolvedFeaturedCollectionSection } from "../../lib/homepage";

export function FeaturedCollectionSection({
  section,
}: {
  section: ResolvedFeaturedCollectionSection;
}) {
  const collection = section.collection;
  const products = collection?.products.nodes ?? [];

  if (!collection || products.length === 0) {
    return null;
  }

  const heading = section.heading?.trim() || collection.title;
  const linkLabel = section.linkLabel?.trim() || "View collection";

  return (
    <section
      className="home-section featured-products"
      aria-labelledby={`${section._key}-heading`}
    >
      <div className="featured-products-header">
        <h2 id={`${section._key}-heading`}>{heading}</h2>
        <Link className="cart-store-link" href={`/store/collections/${collection.handle}`}>
          {linkLabel}
        </Link>
      </div>
      <ul className={productCardStyles.grid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>
    </section>
  );
}
