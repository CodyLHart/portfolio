import type { Notification } from "../../../lib/types";

export const getUnreadNotifications = (notifications: Notification[]) =>
  notifications.filter((notification) => !notification.read_at);

export const getUnreadNotificationCount = (notifications: Notification[]) =>
  getUnreadNotifications(notifications).length;

export const getNotificationLabel = (notification: Notification) => {
  if (notification.type === "friend_request") {
    return `${notification.actor?.display_name ?? "Someone"} sent a friend request.`;
  }

  if (notification.type === "list_invite") {
    const listTitle =
      typeof notification.payload.listTitle === "string"
        ? notification.payload.listTitle
        : "a list";

    return `${notification.actor?.display_name ?? "Someone"} invited you to ${listTitle}.`;
  }

  return "Your role changed.";
};
