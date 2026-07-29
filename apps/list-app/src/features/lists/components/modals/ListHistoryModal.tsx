import type { ListSnapshot } from "../../../../lib/types";
import { formatDateTime } from "../../../../lib/format";
import { ListToolModal } from "./ListToolModal";
import styles from "./ListModals.module.css";

export function ListHistoryModal({
  isOwner,
  onClose,
  openRestoreSnapshot,
  snapshots,
}: {
  isOwner: boolean;
  onClose: () => void;
  openRestoreSnapshot: (snapshot: ListSnapshot) => void;
  snapshots: ListSnapshot[];
}) {
  return (
    <ListToolModal title="History" onClose={onClose}>
      <div className={styles.historyList}>
        {snapshots.length === 0 ? (
          <p className="muted">No saved history yet.</p>
        ) : null}
        {snapshots.map((snapshot) => (
          <div className="small-card" key={snapshot.id}>
            <strong>{snapshot.label}</strong>
            <span className="muted">{formatDateTime(snapshot.created_at)}</span>
            <button
              className="secondary-button"
              disabled={!isOwner}
              onClick={() => openRestoreSnapshot(snapshot)}
              type="button"
            >
              Restore
            </button>
          </div>
        ))}
      </div>
    </ListToolModal>
  );
}
