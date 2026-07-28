import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";

export function ListDetailLoadingPanel({
  onShowMobileListIndex,
}: {
  onShowMobileListIndex: (() => void) | null;
}) {
  return (
    <div className="loading-detail-layout">
      <div className="toolbar">
        <div>
          <button
            className="mobile-back-button"
            disabled={!onShowMobileListIndex}
            onClick={onShowMobileListIndex ?? undefined}
            type="button"
          >
            &larr; Your lists
          </button>
          <p className="eyebrow">Current list</p>
          <h1 className="list-title loading-title">List details</h1>
        </div>
      </div>
      <LoadingSpinner label="Loading list details" />
    </div>
  );
}
