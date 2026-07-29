import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import type {
  ItemDraft,
  List,
  ListItem,
  Suggestion,
} from "../../../lib/types";
import { emptyItemDraft } from "../../../lib/types";
import {
  createListItem,
  deleteListItem,
  updateListItem,
  upsertListItemSuggestion,
} from "../lib/item-api";

export function useListItemMutations({
  activeList,
  canEdit,
  draft,
  editingItem,
  items,
  setDraft,
  setEditingItem,
  setIsAddItemOpen,
  setItems,
  setLists,
  setStatusMessage,
  suggestions,
  supabase,
  user,
}: {
  activeList: List | null;
  canEdit: boolean;
  draft: ItemDraft;
  editingItem: ListItem | null;
  items: ListItem[];
  setDraft: Dispatch<SetStateAction<ItemDraft>>;
  setEditingItem: Dispatch<SetStateAction<ListItem | null>>;
  setIsAddItemOpen: Dispatch<SetStateAction<boolean>>;
  setItems: Dispatch<SetStateAction<ListItem[]>>;
  setLists: Dispatch<SetStateAction<List[]>>;
  setStatusMessage: (message: string | null) => void;
  suggestions: Suggestion[];
  supabase: SupabaseClient;
  user: User | null;
}) {
  const upsertSuggestion = async (
    listId: string,
    title: string,
    category: string,
  ) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return;
    }

    const existing =
      suggestions.find(
        (suggestion) =>
          suggestion.title.toLowerCase() === cleanTitle.toLowerCase(),
      ) ?? null;

    await upsertListItemSuggestion(supabase, {
      category,
      existing,
      listId,
      title: cleanTitle,
    });
  };

  const addItem = async () => {
    if (!activeList || !user || !draft.title.trim() || !canEdit) {
      return;
    }

    const nextPosition =
      Math.max(0, ...items.map((item) => Number(item.position))) + 1;
    const { data, error } = await createListItem(supabase, {
      createdBy: user.id,
      draft,
      listId: activeList.id,
      position: nextPosition,
    });

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setItems((current) => [...current, data as ListItem]);
    adjustListCounts(setLists, activeList.id, {
      completedDelta: 0,
      itemDelta: 1,
    });
    await upsertSuggestion(activeList.id, draft.title, draft.category);
    setDraft(emptyItemDraft);
    setIsAddItemOpen(false);
  };

  const updateItem = async (item: ListItem, patch: Partial<ListItem>) => {
    if (!canEdit) {
      return;
    }

    const { data, error } = await updateListItem(supabase, item.id, patch);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id ? (data as ListItem) : currentItem,
      ),
    );
  };

  const deleteItem = async (item: ListItem) => {
    if (!canEdit) {
      return;
    }

    const { error } = await deleteListItem(supabase, item.id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setItems((current) =>
      current.filter((currentItem) => currentItem.id !== item.id),
    );
    adjustListCounts(setLists, item.list_id, {
      completedDelta: item.completed ? -1 : 0,
      itemDelta: -1,
    });
  };

  const toggleItem = async (item: ListItem) => {
    await updateItem(item, {
      completed: !item.completed,
      completed_at: item.completed ? null : new Date().toISOString(),
      position: item.completed
        ? item.position
        : Math.max(0, ...items.map((entry) => Number(entry.position))) + 1,
    });
    adjustListCounts(setLists, item.list_id, {
      completedDelta: item.completed ? -1 : 1,
      itemDelta: 0,
    });
  };

  const saveItemDetails = async () => {
    if (!editingItem) {
      return;
    }

    await updateItem(editingItem, {
      assigned_to: editingItem.assigned_to || null,
      category: editingItem.category?.trim() || null,
      due_date: editingItem.due_date || null,
      notes: editingItem.notes?.trim() || null,
      priority: editingItem.priority || null,
      quantity: editingItem.quantity?.trim() || null,
      title: editingItem.title.trim(),
    });
    setEditingItem(null);
  };

  return {
    addItem,
    deleteItem,
    saveItemDetails,
    toggleItem,
    updateItem,
    upsertSuggestion,
  };
}

const adjustListCounts = (
  setLists: Dispatch<SetStateAction<List[]>>,
  listId: string,
  delta: { completedDelta: number; itemDelta: number },
) => {
  setLists((current) =>
    current.map((list) =>
      list.id === listId
        ? {
            ...list,
            completed_count: Math.max(
              0,
              (list.completed_count ?? 0) + delta.completedDelta,
            ),
            item_count: Math.max(0, (list.item_count ?? 0) + delta.itemDelta),
          }
        : list,
    ),
  );
};
