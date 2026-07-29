import { AppIcon } from "../../../components/ui/AppIcon";
import { Avatar } from "../../../components/ui/Avatar";
import {
  formatSharedListCount,
  type FriendSummary,
} from "../lib/friend-utils";
import styles from "./FriendRow.module.css";

export function FriendRow({
  drawerId,
  friend,
  isExpanded,
  onOpenFriend,
}: {
  drawerId: string;
  friend: FriendSummary;
  isExpanded: boolean;
  onOpenFriend: (friendId: string) => void;
}) {
  return (
    <button
      aria-controls={drawerId}
      aria-expanded={isExpanded}
      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${friend.profile.display_name}`}
      className={styles.row}
      onClick={() => onOpenFriend(friend.profile.id)}
      type="button"
    >
      <Avatar profile={friend.profile} />
      <span className={styles.main}>
        <strong>{friend.profile.display_name}</strong>
        <span>{formatSharedListCount(friend.sharedLists.length)}</span>
      </span>
      <span
        aria-hidden="true"
        className={`${styles.chevron} ${isExpanded ? styles.expanded : ""}`}
      >
        <AppIcon icon="fa-solid fa-chevron-right" />
      </span>
    </button>
  );
}
