import { formatDateTime } from "../../../lib/format";
import type { Notification } from "../../../lib/types";
import { getNotificationLabel } from "../lib/notification-utils";
import styles from "./NotificationsMenu.module.css";

export function NotificationRow({
  acceptFriendRequest,
  acceptListInvite,
  ignoreNotification,
  notification,
}: {
  acceptFriendRequest: (friendshipId: string) => void;
  acceptListInvite: (collaboratorId: string) => void;
  ignoreNotification: (notification: Notification) => void;
  notification: Notification;
}) {
  return (
    <div className={styles.row}>
      <strong>{getNotificationLabel(notification)}</strong>
      <span className="muted">{formatDateTime(notification.created_at)}</span>
      {notification.type === "friend_request" ? (
        <div className="inline-actions">
          <button
            className="secondary-button"
            onClick={() =>
              acceptFriendRequest(String(notification.payload.friendshipId))
            }
            type="button"
          >
            Accept Friend
          </button>
          <button
            className="secondary-button"
            onClick={() => ignoreNotification(notification)}
            type="button"
          >
            Ignore
          </button>
        </div>
      ) : null}
      {notification.type === "list_invite" ? (
        <div className="inline-actions">
          <button
            className="secondary-button"
            onClick={() =>
              acceptListInvite(String(notification.payload.collaboratorId))
            }
            type="button"
          >
            Accept List
          </button>
          <button
            className="secondary-button"
            onClick={() => ignoreNotification(notification)}
            type="button"
          >
            Ignore
          </button>
        </div>
      ) : null}
    </div>
  );
}
