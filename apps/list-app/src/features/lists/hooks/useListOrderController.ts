import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { List } from "../../../lib/types";
import { getErrorMessage } from "../../../lib/errors";
import type { DropPlacement, ListDropIndicator } from "../types";
import {
  isMissingListOrderPreferencesError,
  saveListOrderPreferences,
} from "../lib/list-api";

export function useListOrderController({
  lists,
  loadLists,
  setLists,
  setStatusMessage,
  supabase,
  user,
}: {
  lists: List[];
  loadLists: (userId: string) => Promise<void>;
  setLists: Dispatch<SetStateAction<List[]>>;
  setStatusMessage: Dispatch<SetStateAction<string | null>>;
  supabase: SupabaseClient;
  user: User | null;
}) {
  const [draggedListId, setDraggedListId] = useState<string | null>(null);
  const [listDropIndicator, setListDropIndicator] =
    useState<ListDropIndicator>(null);

  const persistListOrder = useCallback(
    async (orderedLists: List[]) => {
      if (!user) {
        return;
      }

      let error: unknown = null;

      try {
        const { error: orderError } = await saveListOrderPreferences(supabase, {
          lists: orderedLists,
          userId: user.id,
        });

        error = orderError;
      } catch (orderError) {
        error = orderError;
      }

      if (error) {
        if (isMissingListOrderPreferencesError(error)) {
          setStatusMessage(
            "List ordering is unavailable until the latest Supabase schema is applied.",
          );
          return;
        }

        setStatusMessage(getErrorMessage(error));
        void loadLists(user.id);
      }
    },
    [loadLists, setStatusMessage, supabase, user],
  );

  const reorderListByDrop = useCallback(
    (draggedId: string, targetId: string, placement: DropPlacement) => {
      if (draggedId === targetId) {
        return;
      }

      const draggedIndex = lists.findIndex((list) => list.id === draggedId);
      const targetIndex = lists.findIndex((list) => list.id === targetId);

      if (draggedIndex < 0 || targetIndex < 0) {
        return;
      }

      const orderedLists = [...lists];
      const [movedList] = orderedLists.splice(draggedIndex, 1);
      const nextTargetIndex = orderedLists.findIndex(
        (list) => list.id === targetId,
      );
      const insertionIndex =
        placement === "after" ? nextTargetIndex + 1 : nextTargetIndex;

      orderedLists.splice(insertionIndex, 0, movedList);
      setLists(orderedLists);
      void persistListOrder(orderedLists);
    },
    [lists, persistListOrder, setLists],
  );

  return {
    draggedListId,
    listDropIndicator,
    reorderListByDrop,
    setDraggedListId,
    setListDropIndicator,
  };
}
