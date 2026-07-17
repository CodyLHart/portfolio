import { ProductCard } from "../../components/product/ProductCard";
import productCardStyles from "../../components/product/ProductCard.module.css";
import { getCollections } from "../../lib/shopify/collections";
import { getProducts } from "../../lib/shopify/products";
import Link from "next/link";
import styles from "./StorePage.module.css";

export default async function StorePage() {
  const [products, collections] = await Promise.all([
    getProducts(),
    getCollections(),
  ]);

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <h1>Store</h1>
      </header>
      {collections.length > 0 ? (
        <section
          className={styles.collectionNav}
          aria-labelledby="collection-nav-heading"
        >
          <h2 id="collection-nav-heading">Shop by collection</h2>
          <ul>
            {collections.map((collection) => (
              <li key={collection.handle}>
                <Link href={`/store/collections/${collection.handle}`}>
                  {collection.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {products.length > 0 ? (
        <ul className={productCardStyles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No published products were returned by Shopify.</p>
      )}
    </main>
  );
}
