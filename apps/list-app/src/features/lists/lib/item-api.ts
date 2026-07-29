import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Collaborator,
  ListItem,
  ListSnapshot,
  Suggestion,
} from "../../../lib/types";

export type ListWorkspaceData = {
  collaborators: Collaborator[] | null;
  items: ListItem[] | null;
  snapshots: ListSnapshot[] | null;
  suggestions: Suggestion[] | null;
};

export async function loadListWorkspaceData(
  supabase: SupabaseClient,
  listId: string,
): Promise<ListWorkspaceData> {
  const [
    itemsResult,
    collaboratorsResult,
    snapshotsResult,
    suggestionsResult,
  ] = await Promise.all([
    supabase
      .from("list_items")
      .select("*, assignee:profiles!list_items_assigned_to_fkey(*)")
      .eq("list_id", listId)
      .order("position", { ascending: true }),
    supabase
      .from("list_collaborators")
      .select("*, profile:profiles!list_collaborators_user_id_fkey(*)")
      .eq("list_id", listId),
    supabase
      .from("list_snapshots")
      .select("*")
      .eq("list_id", listId)
      .order("created_at", { ascending: false }),
    supabase
      .from("list_item_suggestions")
      .select("*")
      .eq("list_id", listId)
      .order("usage_count", { ascending: false }),
  ]);

  return {
    collaborators: collaboratorsResult.error
      ? null
      : ((collaboratorsResult.data ?? []) as Collaborator[]),
    items: itemsResult.error ? null : ((itemsResult.data ?? []) as ListItem[]),
    snapshots: snapshotsResult.error
      ? null
      : ((snapshotsResult.data ?? []) as ListSnapshot[]),
    suggestions: suggestionsResult.error
      ? null
      : ((suggestionsResult.data ?? []) as Suggestion[]),
  };
}

export async function deleteListItems(
  supabase: SupabaseClient,
  listId: string,
) {
  return supabase.from("list_items").delete().eq("list_id", listId);
}

export async function insertSnapshotItems(
  supabase: SupabaseClient,
  rows: Partial<ListItem>[],
) {
  return supabase.from("list_items").insert(rows);
}
