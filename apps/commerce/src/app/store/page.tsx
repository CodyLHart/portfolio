import { ProductCard } from "../../components/product/ProductCard";
import { getProducts } from "../../lib/shopify/products";

export default async function StorePage() {
  const products = await getProducts();

  return (
    <main className="store-shell">
      <header className="store-header">
        <h1>Store</h1>
      </header>
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
