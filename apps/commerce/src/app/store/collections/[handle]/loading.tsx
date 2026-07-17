export default function LoadingCollection() {
  return (
    <main className="collection-shell collection-shell-loading">
      <div
        className="collection-loading"
        role="status"
        aria-label="Loading collection"
      >
        <span className="collection-loading-spinner" aria-hidden="true" />
      </div>
    </main>
  );
}
