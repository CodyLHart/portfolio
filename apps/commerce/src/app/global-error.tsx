"use client";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <title>Cody Hart Store — Error</title>
      <body>
        <main className="global-error-shell">
          <section className="global-error-state" aria-labelledby="global-error-heading">
            <h1 id="global-error-heading">Something went wrong</h1>
            <p>
              The store could not finish loading. Please try again or return to
              the store.
            </p>
            <div className="global-error-actions">
              <button type="button" onClick={() => unstable_retry()}>
                Try again
              </button>
              <a href="/store">View store</a>
            </div>
          </section>
        </main>
        <style>{`
          :root {
            background: #f8fafc;
            color: #111827;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            min-height: 100vh;
          }

          .global-error-shell {
            display: grid;
            min-height: 100vh;
            padding: 48px 24px 72px;
            place-items: center;
          }

          .global-error-state {
            display: grid;
            gap: 16px;
            max-width: 560px;
            width: 100%;
          }

          .global-error-state h1,
          .global-error-state p {
            margin: 0;
          }

          .global-error-state h1 {
            font-size: clamp(2rem, 7vw, 3.5rem);
            letter-spacing: 0;
            line-height: 1;
          }

          .global-error-state p {
            color: #475569;
            line-height: 1.6;
          }

          .global-error-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
          }

          .global-error-actions button,
          .global-error-actions a {
            border: 1px solid #111827;
            cursor: pointer;
            display: inline-flex;
            font: inherit;
            font-weight: 800;
            justify-content: center;
            min-height: 44px;
            padding: 10px 14px;
            text-decoration: none;
          }

          .global-error-actions button {
            background: #111827;
            color: #fff;
          }

          .global-error-actions a {
            background: #fff;
            color: #111827;
          }

          .global-error-actions button:focus-visible,
          .global-error-actions a:focus-visible {
            outline: 2px solid #111827;
            outline-offset: 4px;
          }
        `}</style>
      </body>
    </html>
  );
}
