import type { SupabaseClient } from "@supabase/supabase-js";
import type { Collaborator, ListRole, Profile } from "../../../lib/types";

export async function inviteListCollaborator(
  supabase: SupabaseClient,
  {
    invitedBy,
    listId,
    listTitle,
    role,
    targetEmail,
  }: {
    invitedBy: string;
    listId: string;
    listTitle: string;
    role: ListRole;
    targetEmail: string;
  },
) {
  const { data: target } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", targetEmail.trim().toLowerCase())
    .maybeSingle();

  const targetProfile = target as Profile | null;

  if (!targetProfile) {
    throw new Error("No account found for that exact email.");
  }

  const { data, error } = await supabase
    .from("list_collaborators")
    .upsert(
      {
        invited_by: invitedBy,
        list_id: listId,
        role,
        status: "pending",
        user_id: targetProfile.id,
      },
      { onConflict: "list_id,user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await supabase.from("notifications").insert({
    actor_id: invitedBy,
    payload: {
      collaboratorId: (data as Collaborator).id,
      listId,
      listTitle,
    },
    recipient_id: targetProfile.id,
    type: "list_invite",
  });

  return data as Collaborator;
}

export async function updateListCollaboratorRole(
  supabase: SupabaseClient,
  {
    collaboratorId,
    role,
  }: {
    collaboratorId: string;
    role: ListRole;
  },
) {
  return supabase
    .from("list_collaborators")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", collaboratorId);
}

export async function acceptShareLink(
  supabase: SupabaseClient,
  {
    requestedRole,
    token,
  }: {
    requestedRole: "editor" | "viewer";
    token: string;
  },
) {
  return supabase.rpc("accept_share_link", {
    requested_role: requestedRole,
    token,
  });
}
