import { Avatar } from "../../../components/ui/Avatar";
import {
  formatSharedListCount,
  type FriendSummary,
} from "../lib/friend-utils";
import styles from "./FriendRow.module.css";

export function FriendRow({
  friend,
  onOpenFriend,
}: {
  friend: FriendSummary;
  onOpenFriend: (friendId: string) => void;
}) {
  return (
    <a
      className={styles.row}
      href={`/friends/${friend.profile.id}`}
      onClick={(event) => {
        event.preventDefault();
        onOpenFriend(friend.profile.id);
      }}
    >
      <Avatar profile={friend.profile} />
      <span className={styles.main}>
        <strong>{friend.profile.display_name}</strong>
        <span>{formatSharedListCount(friend.sharedLists.length)}</span>
      </span>
      <span aria-hidden="true" className="list-row-chevron">
        &rsaquo;
      </span>
    </a>
  );
}
