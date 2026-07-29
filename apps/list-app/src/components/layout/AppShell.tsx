"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { NotificationsMenu } from "../../features/notifications/components/NotificationsMenu";
import type { Notification, Profile } from "../../lib/types";
import { AppIcon } from "../ui/AppIcon";
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
            <AppIcon fixedWidth icon="fa-solid fa-user-group" />
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
            <AppIcon fixedWidth icon="fa-solid fa-arrow-right-from-bracket" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
