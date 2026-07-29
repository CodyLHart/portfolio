import type { SupabaseClient } from "@supabase/supabase-js";
import type { FriendRequest, Notification } from "../../../lib/types";

export type AccountInboxData = {
  friends: FriendRequest[] | null;
  notifications: Notification[] | null;
};

export async function loadAccountInboxData(
  supabase: SupabaseClient,
  userId: string,
): Promise<AccountInboxData> {
  const [friendsResult, notificationsResult] = await Promise.all([
    supabase
      .from("friendships")
      .select(
        "*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)",
      )
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .order("updated_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("*, actor:profiles!notifications_actor_id_fkey(*)")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    friends: friendsResult.error
      ? null
      : ((friendsResult.data ?? []) as FriendRequest[]),
    notifications: notificationsResult.error
      ? null
      : ((notificationsResult.data ?? []) as Notification[]),
  };
}

export async function acceptFriendRequestNotification(
  supabase: SupabaseClient,
  {
    friendshipId,
    userId,
  }: {
    friendshipId: string;
    userId: string;
  },
) {
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", friendshipId);

  if (error) {
    throw error;
  }

  return supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .eq("type", "friend_request")
    .contains("payload", { friendshipId });
}

export async function acceptListInviteNotification(
  supabase: SupabaseClient,
  {
    collaboratorId,
    userId,
  }: {
    collaboratorId: string;
    userId: string;
  },
) {
  const { error } = await supabase
    .from("list_collaborators")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", collaboratorId);

  if (error) {
    throw error;
  }

  return supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .eq("type", "list_invite")
    .contains("payload", { collaboratorId });
}

export async function ignoreAccountNotification(
  supabase: SupabaseClient,
  {
    notification,
    userId,
  }: {
    notification: Notification;
    userId: string;
  },
) {
  if (notification.type === "friend_request") {
    const friendshipId = String(notification.payload.friendshipId ?? "");
    if (friendshipId) {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "blocked", updated_at: new Date().toISOString() })
        .eq("id", friendshipId)
        .eq("status", "pending");

      if (error) {
        throw error;
      }
    }
  }

  if (notification.type === "list_invite") {
    const collaboratorId = String(notification.payload.collaboratorId ?? "");
    if (collaboratorId) {
      const { error } = await supabase
        .from("list_collaborators")
        .update({ status: "declined", updated_at: new Date().toISOString() })
        .eq("id", collaboratorId)
        .eq("status", "pending");

      if (error) {
        throw error;
      }
    }
  }

  return supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notification.id)
    .eq("recipient_id", userId);
}
