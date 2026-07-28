import styles from "./LoadingSpinner.module.css";

export function LoadingSpinner({ label }: { label: string }) {
  return (
    <div aria-label={label} className={styles.loadingRegion} role="status">
      <span aria-hidden="true" className={styles.spinner} />
    </div>
  );
}
