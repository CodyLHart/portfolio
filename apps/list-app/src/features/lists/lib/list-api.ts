import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Collaborator,
  List,
  ListItemFields,
  ListOrderPreference,
  ListRole,
  Profile,
} from "../../../lib/types";
import { sortListsByPreference } from "./list-utils";

export type AccessibleListsResult = {
  allCollaborators: Collaborator[];
  lists: List[];
};

export type CreateListInput = {
  collaboratorEmail: string;
  collaboratorRole: ListRole;
  itemFields: ListItemFields;
  lists: List[];
  ownerId: string;
  title: string;
};

export type CreateListResult = {
  collaboratorLookupFailed: boolean;
  list: List;
  orderError: unknown;
};

export const isMissingListOrderPreferencesError = (error: unknown) => {
  const maybeError = error as { code?: unknown; message?: unknown };

  return (
    maybeError?.code === "PGRST205" &&
    typeof maybeError.message === "string" &&
    maybeError.message.includes("list_order_preferences")
  );
};

export async function loadAccessibleLists(
  supabase: SupabaseClient,
  userId: string,
): Promise<AccessibleListsResult> {
  const [ownedResult, collabResult, orderResult] = await Promise.all([
    supabase
      .from("lists")
      .select("*")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("list_collaborators")
      .select("list_id, lists(*)")
      .eq("user_id", userId)
      .eq("status", "accepted"),
    supabase.from("list_order_preferences").select("*").eq("user_id", userId),
  ]);

  if (ownedResult.error) {
    throw ownedResult.error;
  }

  if (collabResult.error) {
    throw collabResult.error;
  }

  if (
    orderResult.error &&
    !isMissingListOrderPreferencesError(orderResult.error)
  ) {
    throw orderResult.error;
  }

  const ownedLists = (ownedResult.data ?? []) as List[];
  const collaboratorLists = (collabResult.data ?? [])
    .map((row) => row.lists as unknown as List | null)
    .filter(Boolean) as List[];
  const uniqueLists = Array.from(
    new Map(
      [...ownedLists, ...collaboratorLists].map((list) => [list.id, list]),
    ).values(),
  );
  const orderPreferences = orderResult.error
    ? []
    : ((orderResult.data ?? []) as ListOrderPreference[]);
  const lists = sortListsByPreference(uniqueLists, orderPreferences);
  const listIds = lists.map((list) => list.id);

  if (listIds.length === 0) {
    return { allCollaborators: [], lists };
  }

  const { data, error } = await supabase
    .from("list_collaborators")
    .select("*, profile:profiles!list_collaborators_user_id_fkey(*)")
    .in("list_id", listIds);

  if (error) {
    throw error;
  }

  return { allCollaborators: (data ?? []) as Collaborator[], lists };
}

export async function loadSharedCandidateLists(
  supabase: SupabaseClient,
  userId: string,
): Promise<AccessibleListsResult> {
  const [ownedResult, collabResult] = await Promise.all([
    supabase
      .from("lists")
      .select("*")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("list_collaborators")
      .select("list_id, lists(*)")
      .eq("user_id", userId)
      .eq("status", "accepted"),
  ]);

  if (ownedResult.error) {
    throw ownedResult.error;
  }

  if (collabResult.error) {
    throw collabResult.error;
  }

  const ownedLists = (ownedResult.data ?? []) as List[];
  const collaboratorLists = (collabResult.data ?? [])
    .map((row) => row.lists as unknown as List | null)
    .filter(Boolean) as List[];
  const sharedCandidateLists = Array.from(
    new Map(
      [...ownedLists, ...collaboratorLists].map((list) => [list.id, list]),
    ).values(),
  );
  const listIds = sharedCandidateLists.map((list) => list.id);

  if (listIds.length === 0) {
    return { allCollaborators: [], lists: [] };
  }

  const { data, error } = await supabase
    .from("list_collaborators")
    .select("*, profile:profiles!list_collaborators_user_id_fkey(*)")
    .in("list_id", listIds)
    .eq("status", "accepted");

  if (error) {
    throw error;
  }

  const acceptedCollaborators = (data ?? []) as Collaborator[];
  const sharedListIds = new Set(
    acceptedCollaborators
      .filter(
        (collaborator) =>
          collaborator.user_id !== userId &&
          listIds.includes(collaborator.list_id),
      )
      .map((collaborator) => collaborator.list_id),
  );

  return {
    allCollaborators: acceptedCollaborators.filter((collaborator) =>
      sharedListIds.has(collaborator.list_id),
    ),
    lists: sharedCandidateLists.filter((list) => sharedListIds.has(list.id)),
  };
}

export async function createListWithOwner(
  supabase: SupabaseClient,
  input: CreateListInput,
): Promise<CreateListResult> {
  const { data, error } = await supabase
    .from("lists")
    .insert({
      item_fields: input.itemFields,
      owner_id: input.ownerId,
      title: input.title.trim(),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const list = data as List;

  await supabase.from("list_collaborators").insert({
    list_id: list.id,
    role: "owner",
    status: "accepted",
    user_id: input.ownerId,
  });

  let collaboratorLookupFailed = false;
  const collaboratorEmail = input.collaboratorEmail.trim().toLowerCase();

  if (collaboratorEmail) {
    const { data: target } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", collaboratorEmail)
      .maybeSingle();

    const targetProfile = target as Profile | null;

    if (targetProfile && targetProfile.id !== input.ownerId) {
      const { data: collaborator } = await supabase
        .from("list_collaborators")
        .upsert(
          {
            invited_by: input.ownerId,
            list_id: list.id,
            role: input.collaboratorRole,
            status: "pending",
            user_id: targetProfile.id,
          },
          { onConflict: "list_id,user_id" },
        )
        .select("*")
        .single();

      if (collaborator) {
        await supabase.from("notifications").insert({
          actor_id: input.ownerId,
          payload: {
            collaboratorId: (collaborator as Collaborator).id,
            listId: list.id,
            listTitle: list.title,
          },
          recipient_id: targetProfile.id,
          type: "list_invite",
        });
      }
    } else {
      collaboratorLookupFailed = true;
    }
  }

  const { error: orderError } = await supabase.from("list_order_preferences").upsert(
    [list, ...input.lists].map((orderedList, index) => ({
      list_id: orderedList.id,
      position: index + 1,
      updated_at: new Date().toISOString(),
      user_id: input.ownerId,
    })),
    { onConflict: "user_id,list_id" },
  );

  return { collaboratorLookupFailed, list, orderError };
}

export async function deleteListById(
  supabase: SupabaseClient,
  listId: string,
) {
  return supabase.from("lists").delete().eq("id", listId);
}

export async function renameList(
  supabase: SupabaseClient,
  {
    listId,
    title,
  }: {
    listId: string;
    title: string;
  },
) {
  return supabase
    .from("lists")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", listId);
}

export async function updateListItemFields(
  supabase: SupabaseClient,
  {
    itemFields,
    listId,
  }: {
    itemFields: ListItemFields;
    listId: string;
  },
) {
  return supabase
    .from("lists")
    .update({ item_fields: itemFields, updated_at: new Date().toISOString() })
    .eq("id", listId);
}

export async function saveListOrderPreferences(
  supabase: SupabaseClient,
  {
    lists,
    userId,
  }: {
    lists: List[];
    userId: string;
  },
) {
  const timestamp = new Date().toISOString();

  return supabase.from("list_order_preferences").upsert(
    lists.map((list, index) => ({
      list_id: list.id,
      position: index + 1,
      updated_at: timestamp,
      user_id: userId,
    })),
    { onConflict: "user_id,list_id" },
  );
}
