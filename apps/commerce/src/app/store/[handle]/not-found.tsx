import { BackButton } from "../../../components/navigation/BackButton";

export default function ProductNotFound() {
  return (
    <main className="product-detail-shell">
      <section className="not-found-state" aria-labelledby="not-found-heading">
        <h1 id="not-found-heading">Product not found</h1>
        <p>The product could not be found.</p>
        <BackButton />
      </section>
    </main>
  );
}
