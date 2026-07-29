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

export function FriendDetailLoadingPanel({
  onBackToFriends,
}: {
  onBackToFriends?: () => void;
}) {
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button
          aria-label="Back to friends"
          className={`mobile-back-button ${styles.backButton}`}
          disabled={!onBackToFriends}
          onClick={onBackToFriends}
          type="button"
        >
          <AppIcon icon="fa-solid fa-arrow-left" />
          Friends
        </button>
        <div>
          <p className="eyebrow">Friend</p>
          <h1>Friend details</h1>
        </div>
      </div>
      <div className={styles.section}>
        <div>
          <h2>Shared lists</h2>
          <p className="muted">
            Open a shared list to manage it with the existing list tools.
          </p>
        </div>
        <div className={styles.rows}>
          <LoadingSpinner label="Loading shared lists" />
        </div>
      </div>
    </div>
  );
}
