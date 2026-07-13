import { ProductCard } from "../../components/product/ProductCard";
import { getCollections } from "../../lib/shopify/collections";
import { getProducts } from "../../lib/shopify/products";
import Link from "next/link";

export default async function StorePage() {
  const [products, collections] = await Promise.all([
    getProducts(),
    getCollections(),
  ]);

  return (
    <main className="store-shell">
      <header className="store-header">
        <h1>Store</h1>
      </header>
      {collections.length > 0 ? (
        <section
          className="collection-nav"
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
        <ul className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ul>
      ) : (
        <p className="store-empty">No published products were returned by Shopify.</p>
      )}
    </main>
  );
}
