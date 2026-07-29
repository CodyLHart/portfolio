import type { FriendSummary } from "../lib/friend-utils";
import { FriendRow } from "./FriendRow";
import styles from "./FriendsPage.module.css";

export function FriendsIndex({
  friendSummaries,
  onOpenFriend,
  showLists,
}: {
  friendSummaries: FriendSummary[];
  onOpenFriend: (friendId: string) => void;
  showLists: () => void;
}) {
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button
          className={`mobile-back-button ${styles.backButton}`}
          onClick={showLists}
          type="button"
        >
          &larr; Your lists
        </button>
        <div>
          <p className="eyebrow">People</p>
          <h1>Friends</h1>
        </div>
      </div>
      {friendSummaries.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No friends yet</h2>
          <p>People you share lists with will appear here.</p>
        </div>
      ) : (
        <div className={styles.rows}>
          {friendSummaries.map((friend) => (
            <FriendRow
              friend={friend}
              key={friend.profile.id}
              onOpenFriend={onOpenFriend}
            />
          ))}
        </div>
      )}
    </div>
  );
}
