import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import type { List, ListItem, ListSnapshot } from "../../../lib/types";
import { getErrorMessage } from "../../../lib/errors";
import {
  deleteCompletedListItems,
  deleteListItems,
  insertSnapshotItems,
} from "../lib/item-api";
import {
  buildSnapshotRestoreRows,
  createListSnapshot,
} from "../lib/history-api";

export function useListHistoryController({
  activeList,
  isOwner,
  items,
  loadListData,
  setItems,
  setLists,
  setRestoreSnapshot,
  setStatusMessage,
  supabase,
  upsertSuggestion,
  user,
}: {
  activeList: List | null;
  isOwner: boolean;
  items: ListItem[];
  loadListData: (listId: string) => void;
  setItems: Dispatch<SetStateAction<ListItem[]>>;
  setLists: Dispatch<SetStateAction<List[]>>;
  setRestoreSnapshot: Dispatch<SetStateAction<ListSnapshot | null>>;
  setStatusMessage: (message: string | null) => void;
  supabase: SupabaseClient;
  upsertSuggestion: (
    listId: string,
    title: string,
    category: string,
  ) => Promise<void>;
  user: User | null;
}) {
  const createSnapshot = async (label: string) => {
    if (!activeList || !user || items.length === 0) {
      return null;
    }

    try {
      return await createListSnapshot(supabase, {
        createdBy: user.id,
        items,
        label,
        listId: activeList.id,
      });
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
      return null;
    }
  };

  const removeCompleted = async () => {
    if (!activeList || !isOwner) {
      return;
    }

    await createSnapshot("Before removing completed");
    const completed = items.filter((item) => item.completed);
    await Promise.all(
      completed.map((item) =>
        upsertSuggestion(activeList.id, item.title, item.category ?? ""),
      ),
    );
    const { error } = await deleteCompletedListItems(supabase, activeList.id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setItems((current) => current.filter((item) => !item.completed));
    setLists((current) =>
      current.map((list) =>
        list.id === activeList.id
          ? {
              ...list,
              completed_count: 0,
              item_count: Math.max(0, (list.item_count ?? 0) - completed.length),
            }
          : list,
      ),
    );
  };

  const clearAll = async () => {
    if (!activeList || !isOwner) {
      return;
    }

    await createSnapshot("Before clearing all");
    await Promise.all(
      items.map((item) =>
        upsertSuggestion(activeList.id, item.title, item.category ?? ""),
      ),
    );
    const { error } = await deleteListItems(supabase, activeList.id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setItems([]);
    setLists((current) =>
      current.map((list) =>
        list.id === activeList.id
          ? { ...list, completed_count: 0, item_count: 0 }
          : list,
      ),
    );
  };

  const restoreList = async (snapshot: ListSnapshot) => {
    if (!activeList || !user || !isOwner) {
      return;
    }

    if (items.length > 0) {
      await createSnapshot("Before restoring snapshot");
    }

    await deleteListItems(supabase, activeList.id);
    const rows = buildSnapshotRestoreRows({
      createdBy: user.id,
      listId: activeList.id,
      snapshot,
    });

    if (rows.length > 0) {
      const { error } = await insertSnapshotItems(supabase, rows);

      if (error) {
        setStatusMessage(error.message);
        return;
      }
    }

    setRestoreSnapshot(null);
    setLists((current) =>
      current.map((list) =>
        list.id === activeList.id
          ? {
              ...list,
              completed_count: rows.filter((row) => row.completed).length,
              item_count: rows.length,
            }
          : list,
      ),
    );
    loadListData(activeList.id);
  };

  return {
    clearAll,
    createSnapshot,
    removeCompleted,
    restoreList,
  };
}
