"use client";

import { useEffect, useRef, useState } from "react";
import { AppIcon } from "../../../components/ui/AppIcon";
import type { Notification } from "../../../lib/types";
import {
  getUnreadNotificationCount,
  getUnreadNotifications,
} from "../lib/notification-utils";
import { NotificationRow } from "./NotificationRow";
import styles from "./NotificationsMenu.module.css";

export function NotificationsMenu({
  acceptFriendRequest,
  acceptListInvite,
  ignoreNotification,
  notifications,
}: {
  acceptFriendRequest: (friendshipId: string) => void;
  acceptListInvite: (collaboratorId: string) => void;
  ignoreNotification: (notification: Notification) => void;
  notifications: Notification[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const visibleNotifications = getUnreadNotifications(notifications);
  const unreadCount = getUnreadNotificationCount(notifications);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className={styles.popover} ref={popoverRef}>
      <button
        aria-expanded={isOpen}
        aria-label="Notifications"
        className={styles.button}
        onClick={() => setIsOpen((open) => !open)}
        ref={buttonRef}
        type="button"
      >
        <AppIcon icon="fa-solid fa-bell" />
        {unreadCount > 0 ? (
          <span className={styles.badge}>{unreadCount}</span>
        ) : null}
      </button>
      {isOpen ? (
        <div aria-label="Notifications menu" className={styles.panel}>
          <p className="eyebrow">Inbox</p>
          <div className={styles.list}>
            {visibleNotifications.length === 0 ? (
              <p className="muted">No notifications.</p>
            ) : null}
            {visibleNotifications.map((notification) => (
              <NotificationRow
                acceptFriendRequest={acceptFriendRequest}
                acceptListInvite={acceptListInvite}
                ignoreNotification={ignoreNotification}
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
