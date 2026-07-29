import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Collaborator,
  ItemDraft,
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

export async function createListItem(
  supabase: SupabaseClient,
  {
    createdBy,
    draft,
    listId,
    position,
  }: {
    createdBy: string;
    draft: ItemDraft;
    listId: string;
    position: number;
  },
) {
  return supabase
    .from("list_items")
    .insert({
      assigned_to: draft.assigned_to || null,
      category: draft.category.trim() || null,
      created_by: createdBy,
      due_date: draft.due_date || null,
      list_id: listId,
      notes: draft.notes.trim() || null,
      position,
      priority: draft.priority || null,
      quantity: draft.quantity.trim() || null,
      title: draft.title.trim(),
    })
    .select("*, assignee:profiles!list_items_assigned_to_fkey(*)")
    .single();
}

export async function updateListItem(
  supabase: SupabaseClient,
  itemId: string,
  patch: Partial<ListItem>,
) {
  return supabase
    .from("list_items")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .select("*, assignee:profiles!list_items_assigned_to_fkey(*)")
    .single();
}

export async function deleteListItem(
  supabase: SupabaseClient,
  itemId: string,
) {
  return supabase.from("list_items").delete().eq("id", itemId);
}

export async function deleteCompletedListItems(
  supabase: SupabaseClient,
  listId: string,
) {
  return supabase
    .from("list_items")
    .delete()
    .eq("list_id", listId)
    .eq("completed", true);
}

export async function insertSnapshotItems(
  supabase: SupabaseClient,
  rows: Partial<ListItem>[],
) {
  return supabase.from("list_items").insert(rows);
}

export async function updateListItemPositions(
  supabase: SupabaseClient,
  items: Pick<ListItem, "id" | "position">[],
) {
  return Promise.all(
    items.map((item) =>
      supabase
        .from("list_items")
        .update({ position: item.position })
        .eq("id", item.id),
    ),
  );
}

export async function upsertListItemSuggestion(
  supabase: SupabaseClient,
  {
    category,
    existing,
    listId,
    title,
  }: {
    category: string;
    existing: Suggestion | null;
    listId: string;
    title: string;
  },
) {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    return null;
  }

  if (existing) {
    return supabase
      .from("list_item_suggestions")
      .update({
        category: category.trim() || existing.category,
        last_used_at: new Date().toISOString(),
        usage_count: existing.usage_count + 1,
      })
      .eq("id", existing.id);
  }

  return supabase.from("list_item_suggestions").insert({
    category: category.trim() || null,
    list_id: listId,
    title: cleanTitle,
  });
}
