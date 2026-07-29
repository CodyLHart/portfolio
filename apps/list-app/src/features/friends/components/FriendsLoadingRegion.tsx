import { AppIcon } from "../../../components/ui/AppIcon";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import styles from "./FriendsPage.module.css";

export function FriendsIndexLoadingPanel({
  showLists,
}: {
  showLists: (() => void) | null;
}) {
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button
          className={`mobile-back-button ${styles.backButton}`}
          disabled={!showLists}
          onClick={showLists ?? undefined}
          type="button"
        >
          <AppIcon icon="fa-solid fa-arrow-left" />
          Your lists
        </button>
        <div>
          <p className="eyebrow">People</p>
          <h1>Friends</h1>
        </div>
      </div>
      <div className={styles.rows}>
        <LoadingSpinner label="Loading friends" />
      </div>
    </div>
  );
}
