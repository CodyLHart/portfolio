import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import type { Profile } from "../../../lib/types";

export function useAppRealtimeSubscriptions({
  activeListId,
  clearListDetail,
  loadFriendsAndNotifications,
  loadListData,
  loadLists,
  profile,
  setPresenceUsers,
  supabase,
  user,
}: {
  activeListId: string | null;
  clearListDetail: () => void;
  loadFriendsAndNotifications: (userId: string) => void;
  loadListData: (listId: string) => void;
  loadLists: (userId: string) => void;
  profile: Profile | null;
  setPresenceUsers: Dispatch<SetStateAction<Profile[]>>;
  supabase: SupabaseClient;
  user: User | null;
}) {
  useEffect(() => {
    if (!user) {
      return;
    }

    queueMicrotask(() => {
      loadFriendsAndNotifications(user.id);
    });

    const channel = supabase
      .channel(`user:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => loadFriendsAndNotifications(user.id),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        () => loadFriendsAndNotifications(user.id),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadFriendsAndNotifications, supabase, user]);

  useEffect(() => {
    if (!activeListId || !user) {
      queueMicrotask(clearListDetail);
      return;
    }

    queueMicrotask(() => {
      loadListData(activeListId);
    });

    const channel = supabase.channel(`list:${activeListId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "list_items",
          filter: `list_id=eq.${activeListId}`,
        },
        () => loadListData(activeListId),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lists",
          filter: `id=eq.${activeListId}`,
        },
        () => loadLists(user.id),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "list_collaborators",
          filter: `list_id=eq.${activeListId}`,
        },
        () => {
          loadListData(activeListId);
          loadLists(user.id);
        },
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ profile: Profile }>();
        setPresenceUsers(
          Object.values(state)
            .flat()
            .map((presence) => presence.profile)
            .filter((presenceProfile) => presenceProfile.id !== user.id),
        );
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && profile) {
          await channel.track({ profile });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    activeListId,
    clearListDetail,
    loadListData,
    loadLists,
    profile,
    setPresenceUsers,
    supabase,
    user,
  ]);
}
