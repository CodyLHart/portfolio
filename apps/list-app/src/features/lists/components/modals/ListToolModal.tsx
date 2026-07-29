import type { ReactNode } from "react";
import styles from "./ListModals.module.css";

export function ListToolModal({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        aria-label={title}
        className={`${styles.modal} ${styles.toolModal}`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className={styles.header}>
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} type="button">
            x
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
