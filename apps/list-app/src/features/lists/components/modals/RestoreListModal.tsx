import type { Dispatch, SetStateAction } from "react";
import type { ListSnapshot } from "../../../../lib/types";
import styles from "./ListModals.module.css";

export function RestoreListModal({
  currentHasItems,
  restoreList,
  setRestoreSnapshot,
  snapshot,
}: {
  currentHasItems: boolean;
  restoreList: (snapshot: ListSnapshot) => void;
  setRestoreSnapshot: Dispatch<SetStateAction<ListSnapshot | null>>;
  snapshot: ListSnapshot;
}) {
  return (
    <div
      className={styles.backdrop}
      onMouseDown={() => setRestoreSnapshot(null)}
    >
      <div
        aria-label="Restore list"
        className={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2>Restore list</h2>
        <p>
          {currentHasItems
            ? "Restoring this snapshot will overwrite the current list. A snapshot of the current list will be saved first."
            : "Restoring this snapshot will refill the empty list."}
        </p>
        <div className="inline-actions">
          <button
            className="danger-button"
            onClick={() => restoreList(snapshot)}
            type="button"
          >
            Restore
          </button>
          <button
            className="secondary-button"
            onClick={() => setRestoreSnapshot(null)}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
