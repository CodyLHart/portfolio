import { Avatar } from "../../../components/ui/Avatar";
import type { FriendSummary } from "../lib/friend-utils";
import { SharedListRow } from "./SharedListRow";
import styles from "./FriendsPage.module.css";

export function FriendDetail({
  onBackToFriends,
  onOpenList,
  selectedFriend,
}: {
  onBackToFriends: () => void;
  onOpenList: (listId: string) => void;
  selectedFriend: FriendSummary;
}) {
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button
          aria-label="Back to friends"
          className={`mobile-back-button ${styles.backButton}`}
          onClick={onBackToFriends}
          type="button"
        >
          &larr; Friends
        </button>
        <div className={styles.heading}>
          <Avatar profile={selectedFriend.profile} size="large" />
          <div>
            <p className="eyebrow">Friend</p>
            <h1>{selectedFriend.profile.display_name}</h1>
            <p className="muted">{selectedFriend.profile.email}</p>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <div>
          <h2>Lists shared with {selectedFriend.profile.display_name}</h2>
          <p className="muted">
            Open a shared list to manage it with the existing list tools.
          </p>
        </div>
        {selectedFriend.sharedLists.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>No shared lists</h2>
            <p>
              You don&apos;t currently have any lists shared with this person.
            </p>
          </div>
        ) : (
          <div className={styles.rows}>
            {selectedFriend.sharedLists.map((sharedList) => (
              <SharedListRow
                key={sharedList.list.id}
                onOpenList={onOpenList}
                sharedList={sharedList}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function FriendNotFound({
  onBackToFriends,
}: {
  onBackToFriends: () => void;
}) {
  return (
    <div className={styles.screen}>
      <button
        aria-label="Back to friends"
        className={`mobile-back-button ${styles.backButton}`}
        onClick={onBackToFriends}
        type="button"
      >
        &larr; Friends
      </button>
      <div className={styles.emptyState}>
        <h2>No shared lists</h2>
        <p>You no longer share any lists with this person.</p>
        <button
          className="secondary-button"
          onClick={onBackToFriends}
          type="button"
        >
          Back to friends
        </button>
      </div>
    </div>
  );
}
