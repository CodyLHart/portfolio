import { AppIcon } from "../../../components/ui/AppIcon";
import type { FriendSummary } from "../lib/friend-utils";
import { FriendRow } from "./FriendRow";
import { SharedListRow } from "./SharedListRow";
import styles from "./FriendsPage.module.css";

export function FriendsIndex({
  friendSummaries,
  onOpenFriend,
  onOpenList,
  selectedFriend,
  selectedFriendId,
  showLists,
}: {
  friendSummaries: FriendSummary[];
  onOpenFriend: (friendId: string) => void;
  onOpenList: (listId: string) => void;
  selectedFriend: FriendSummary | null;
  selectedFriendId: string | null;
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
          <AppIcon icon="fa-solid fa-arrow-left" />
          Your lists
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
          {friendSummaries.map((friend) => {
            const drawerId = `friend-drawer-${friend.profile.id}`;
            const isExpanded = friend.profile.id === selectedFriendId;
            const drawerFriend =
              isExpanded && selectedFriend?.profile.id === friend.profile.id
                ? selectedFriend
                : null;

            return (
              <div className={styles.friendDisclosure} key={friend.profile.id}>
                <FriendRow
                  drawerId={drawerId}
                  friend={friend}
                  isExpanded={isExpanded}
                  onOpenFriend={onOpenFriend}
                />
                {isExpanded ? (
                  <div
                    className={styles.friendDrawer}
                    id={drawerId}
                    role="region"
                    aria-label={`Shared lists with ${friend.profile.display_name}`}
                  >
                    <h2>Shared lists</h2>
                    {drawerFriend ? (
                      drawerFriend.sharedLists.length > 0 ? (
                        <div className={styles.drawerRows}>
                          {drawerFriend.sharedLists.map((sharedList) => (
                            <SharedListRow
                              key={sharedList.list.id}
                              onOpenList={onOpenList}
                              sharedList={sharedList}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="muted">
                          You no longer share any lists with this person.
                        </p>
                      )
                    ) : (
                      <p className="muted">
                        You no longer share any lists with this person.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
