import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListItem, ListSnapshot, SnapshotItem } from "../../../lib/types";

export async function createListSnapshot(
  supabase: SupabaseClient,
  {
    createdBy,
    items,
    label,
    listId,
  }: {
    createdBy: string;
    items: ListItem[];
    label: string;
    listId: string;
  },
): Promise<ListSnapshot> {
  const snapshotItems: SnapshotItem[] = items.map((item) => ({
    assigned_to: item.assigned_to,
    category: item.category,
    completed: item.completed,
    due_date: item.due_date,
    notes: item.notes,
    position: item.position,
    priority: item.priority,
    quantity: item.quantity,
    title: item.title,
  }));

  const { data, error } = await supabase
    .from("list_snapshots")
    .insert({
      created_by: createdBy,
      items: snapshotItems,
      label,
      list_id: listId,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as ListSnapshot;
}

export function buildSnapshotRestoreRows({
  createdBy,
  listId,
  snapshot,
}: {
  createdBy: string;
  listId: string;
  snapshot: ListSnapshot;
}) {
  return snapshot.items.map((item, index) => ({
    ...item,
    assigned_to: item.assigned_to || null,
    completed_at: item.completed ? new Date().toISOString() : null,
    created_by: createdBy,
    list_id: listId,
    position: index + 1,
  }));
}
