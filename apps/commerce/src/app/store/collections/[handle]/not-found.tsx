import Link from "next/link";

export default function CollectionNotFound() {
  return (
    <main className="not-found-state">
      <h1>Collection not found</h1>
      <p>The requested collection could not be found.</p>
      <Link className="commerce-link" href="/store">
        Back to store
      </Link>
    </main>
  );
}
