"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { formatDateTime } from "../../lib/format";
import type { Notification, Profile } from "../../lib/types";
import { Avatar } from "../ui/Avatar";
import styles from "./AppShell.module.css";

type AppShellProps = {
  acceptFriendRequest?: (friendshipId: string) => void;
  acceptListInvite?: (collaboratorId: string) => void;
  children: ReactNode;
  headerAction?: ReactNode;
  ignoreNotification?: (notification: Notification) => void;
  isAccountLoading?: boolean;
  notifications?: Notification[];
  onSignOut: (() => void) | null;
  profile: Profile | null;
};

export function AppShell({
  acceptFriendRequest,
  acceptListInvite,
  children,
  headerAction,
  ignoreNotification,
  isAccountLoading = false,
  notifications = [],
  onSignOut,
  profile,
}: AppShellProps) {
  return (
    <div className={styles.appShell}>
      <header className={styles.header}>
        <a className={styles.logo} href="/" aria-label="Lists home">
          <span>Lists</span>
        </a>
        <nav className={styles.nav} aria-label="Navigation">
          {headerAction}
          {profile ? (
            <div className={styles.avatarRow}>
              {acceptFriendRequest && acceptListInvite && ignoreNotification ? (
                <NotificationsMenu
                  acceptFriendRequest={acceptFriendRequest}
                  acceptListInvite={acceptListInvite}
                  ignoreNotification={ignoreNotification}
                  notifications={notifications}
                />
              ) : null}
              <AccountMenu onSignOut={onSignOut} profile={profile} />
            </div>
          ) : isAccountLoading ? (
            <div aria-hidden="true" className={`${styles.avatarRow} ${styles.accountLoading}`}>
              <span className={styles.accountLoadingButton} />
              <span className={styles.accountLoadingAvatar} />
            </div>
          ) : null}
        </nav>
      </header>
      {children}
    </div>
  );
}

function AccountMenu({
  onSignOut,
  profile,
}: {
  onSignOut: (() => void) | null;
  profile: Profile;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
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
    <div className={styles.accountMenu} ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open account menu"
        className={styles.avatarButton}
        onClick={() => setIsOpen((open) => !open)}
        ref={buttonRef}
        type="button"
      >
        <Avatar profile={profile} />
      </button>
      {isOpen ? (
        <div aria-label="Account menu" className={styles.accountPanel}>
          <div className={styles.accountIdentity}>
            <Avatar profile={profile} />
            <span className={styles.accountText}>
              <strong>{profile.display_name}</strong>
              <span>{profile.email}</span>
            </span>
          </div>
          <div className={styles.divider} />
          <a
            className={styles.menuItem}
            href="/friends"
            onClick={() => setIsOpen(false)}
          >
            Friends
          </a>
          <div className={styles.divider} />
          <button
            className={`${styles.menuItem} ${styles.signOutItem}`}
            onClick={() => {
              setIsOpen(false);
              onSignOut?.();
            }}
            type="button"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

type NotificationsMenuProps = {
  acceptFriendRequest: (friendshipId: string) => void;
  acceptListInvite: (collaboratorId: string) => void;
  ignoreNotification: (notification: Notification) => void;
  notifications: Notification[];
};

function NotificationsMenu({
  acceptFriendRequest,
  acceptListInvite,
  ignoreNotification,
  notifications,
}: NotificationsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const visibleNotifications = notifications.filter(
    (notification) => !notification.read_at,
  );
  const unreadCount = visibleNotifications.length;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className={`popover ${styles.notificationPopover}`} ref={popoverRef}>
      <button
        aria-label="Notifications"
        className={styles.notificationButton}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path
            d="M6.5 10.5a5.5 5.5 0 0 1 11 0v4.1l1.6 2.4H4.9l1.6-2.4v-4.1Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M9.5 19a2.8 2.8 0 0 0 5 0"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className={styles.notificationBadge}>{unreadCount}</span>
        ) : null}
      </button>
      {isOpen ? (
        <div className="popover-panel">
          <p className="eyebrow">Inbox</p>
          <div className="notification-list">
            {visibleNotifications.length === 0 ? (
              <p className="muted">No notifications.</p>
            ) : null}
            {visibleNotifications.map((notification) => (
              <div className="small-card" key={notification.id}>
                <strong>{notificationLabel(notification)}</strong>
                <span className="muted">
                  {formatDateTime(notification.created_at)}
                </span>
                {notification.type === "friend_request" ? (
                  <div className="inline-actions">
                    <button
                      className="secondary-button"
                      onClick={() =>
                        acceptFriendRequest(
                          String(notification.payload.friendshipId),
                        )
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
                        acceptListInvite(
                          String(notification.payload.collaboratorId),
                        )
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
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const notificationLabel = (notification: Notification) => {
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
