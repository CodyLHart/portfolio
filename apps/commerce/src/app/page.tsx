import { shopifyStorefrontRequest } from "../lib/shopify/client";
import { PRODUCTS_QUERY } from "../lib/shopify/queries/products";
import type { ProductsQueryResponse } from "../lib/shopify/types";

export default async function Page() {
  const data = await shopifyStorefrontRequest<ProductsQueryResponse>({
    query: PRODUCTS_QUERY,
  });
  const products = data.products.nodes;

  return (
    <main className="commerce-shell">
      <section className="commerce-intro" aria-labelledby="commerce-heading">
        <p className="commerce-eyebrow">Headless Commerce</p>
        <h1 id="commerce-heading">Commerce app initialized</h1>
        <p>Shopify and Sanity will be connected next.</p>
      </section>
      <section
        className="commerce-products"
        aria-labelledby="shopify-products-heading"
      >
        <h2 id="shopify-products-heading">Products from Shopify</h2>
        {products.length > 0 ? (
          <ul>
            {products.map((product) => (
              <li key={product.id}>
                <span>{product.title}</span>
                <small>{product.handle}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No published products were returned by Shopify.</p>
        )}
      </section>
    </main>
  );
}
