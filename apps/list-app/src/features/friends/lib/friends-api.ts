import type { SupabaseClient } from "@supabase/supabase-js";
import type { FriendRequest, Profile } from "../../../lib/types";

export async function sendFriendRequestByEmail(
  supabase: SupabaseClient,
  {
    email,
    userId,
  }: {
    email: string;
    userId: string;
  },
): Promise<{ friendship: FriendRequest }> {
  const { data: target, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error || !target) {
    throw new Error("No account found for that exact email.");
  }

  const targetProfile = target as Profile;

  if (targetProfile.id === userId) {
    throw new Error("You cannot add yourself as a friend.");
  }

  const { data: friendship, error: friendshipError } = await supabase
    .from("friendships")
    .insert({
      addressee_id: targetProfile.id,
      requester_id: userId,
      status: "pending",
    })
    .select("*")
    .single();

  if (friendshipError) {
    throw friendshipError;
  }

  await supabase.from("notifications").insert({
    actor_id: userId,
    payload: { friendshipId: (friendship as FriendRequest).id },
    recipient_id: targetProfile.id,
    type: "friend_request",
  });

  return { friendship: friendship as FriendRequest };
}
