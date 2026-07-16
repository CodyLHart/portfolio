"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Storefront route error", {
        digest: error.digest,
        name: error.name,
      });
    }
  }, [error]);

  return (
    <main className="error-shell">
      <section className="error-state" aria-labelledby="error-heading">
        <h1 id="error-heading">Something went wrong</h1>
        <p>The page could not be loaded. Please try again or return to the store.</p>
        <div className="error-actions">
          <button className="error-button" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="error-link" href="/store">
            View store
          </Link>
        </div>
      </section>
    </main>
  );
}
