import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { FriendRequest, Notification } from "../../../lib/types";
import { getErrorMessage } from "../../../lib/errors";
import {
  acceptFriendRequestNotification,
  acceptListInviteNotification,
  ignoreAccountNotification,
  loadAccountInboxData,
} from "../lib/notifications-api";

export function useNotificationsController({
  loadLists,
  setStatusMessage,
  supabase,
  user,
}: {
  loadLists: (userId: string) => Promise<void>;
  setStatusMessage: Dispatch<SetStateAction<string | null>>;
  supabase: SupabaseClient;
  user: User | null;
}) {
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadFriendsAndNotifications = useCallback(async (userId: string) => {
    const data = await loadAccountInboxData(supabase, userId);

    if (data.friends) {
      setFriends(data.friends);
    }

    if (data.notifications) {
      setNotifications(data.notifications);
    }
  }, [supabase]);

  const acceptFriendRequest = useCallback(
    async (friendshipId: string) => {
      if (!user) {
        return;
      }

      let error: unknown = null;

      try {
        const result = await acceptFriendRequestNotification(supabase, {
          friendshipId,
          userId: user.id,
        });
        error = result.error;
      } catch (requestError) {
        error = requestError;
      }

      if (error) {
        setStatusMessage(getErrorMessage(error));
        return;
      }

      await loadFriendsAndNotifications(user.id);
    },
    [loadFriendsAndNotifications, setStatusMessage, supabase, user],
  );

  const acceptListInvite = useCallback(
    async (collaboratorId: string) => {
      if (!user) {
        return;
      }

      let error: unknown = null;

      try {
        const result = await acceptListInviteNotification(supabase, {
          collaboratorId,
          userId: user.id,
        });
        error = result.error;
      } catch (requestError) {
        error = requestError;
      }

      if (error) {
        setStatusMessage(getErrorMessage(error));
        return;
      }

      await loadLists(user.id);
      await loadFriendsAndNotifications(user.id);
    },
    [loadFriendsAndNotifications, loadLists, setStatusMessage, supabase, user],
  );

  const ignoreNotification = useCallback(
    async (notification: Notification) => {
      if (!user) {
        return;
      }

      let error: unknown = null;

      try {
        const result = await ignoreAccountNotification(supabase, {
          notification,
          userId: user.id,
        });
        error = result.error;
      } catch (requestError) {
        error = requestError;
      }

      if (error) {
        setStatusMessage(getErrorMessage(error));
        return;
      }

      await loadFriendsAndNotifications(user.id);
      await loadLists(user.id);
    },
    [loadFriendsAndNotifications, loadLists, setStatusMessage, supabase, user],
  );

  return {
    acceptFriendRequest,
    acceptListInvite,
    friends,
    ignoreNotification,
    loadFriendsAndNotifications,
    notifications,
  };
}
