import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import { useRef, useState } from "react";
import type { ListItem } from "../../../lib/types";
import type { DropPlacement } from "../types";
import { updateListItemPositions } from "../lib/item-api";

export function useListItemReordering({
  activeListId,
  canEdit,
  items,
  loadListData,
  setItems,
  setStatusMessage,
  supabase,
}: {
  activeListId: string | null;
  canEdit: boolean;
  items: ListItem[];
  loadListData: (listId: string) => void;
  setItems: Dispatch<SetStateAction<ListItem[]>>;
  setStatusMessage: (message: string | null) => void;
  supabase: SupabaseClient;
}) {
  const dropHandledRef = useRef(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    itemId: string;
    placement: DropPlacement;
  } | null>(null);

  const reorderItem = async (
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
  ) => {
    if (!canEdit || draggedId === targetId) {
      return;
    }

    const draggedItem = items.find((item) => item.id === draggedId);
    const targetItem = items.find((item) => item.id === targetId);

    if (!draggedItem || !targetItem) {
      return;
    }

    const orderedItems = items
      .filter((entry) => entry.completed === draggedItem.completed)
      .sort((first, second) => first.position - second.position);
    const fromIndex = orderedItems.findIndex((entry) => entry.id === draggedId);

    if (fromIndex < 0) {
      return;
    }

    const nextOrderedItems = [...orderedItems];
    const [movedItem] = nextOrderedItems.splice(fromIndex, 1);
    const targetIndexAfterRemoval = nextOrderedItems.findIndex(
      (entry) => entry.id === targetId,
    );

    if (
      targetIndexAfterRemoval < 0 &&
      draggedItem.completed === targetItem.completed
    ) {
      return;
    }

    const insertionIndex =
      targetIndexAfterRemoval < 0
        ? nextOrderedItems.length
        : placement === "after"
          ? targetIndexAfterRemoval + 1
          : targetIndexAfterRemoval;
    nextOrderedItems.splice(insertionIndex, 0, movedItem);

    const updatedItems = nextOrderedItems.map((item, index) => ({
      ...item,
      position: index + 1,
    }));

    setItems((current) =>
      current.map(
        (item) =>
          updatedItems.find((updatedItem) => updatedItem.id === item.id) ??
          item,
      ),
    );

    const results = await updateListItemPositions(supabase, updatedItems);
    const failedResult = results.find((result) => result.error);

    if (failedResult?.error) {
      setStatusMessage(failedResult.error.message);
      if (activeListId) {
        loadListData(activeListId);
      }
    }
  };

  const beginItemDrag = (itemId: string) => {
    dropHandledRef.current = false;
    setDraggedItemId(itemId);
  };

  const finishItemDrag = () => {
    if (!dropHandledRef.current && draggedItemId && dropIndicator) {
      void reorderItem(
        draggedItemId,
        dropIndicator.itemId,
        dropIndicator.placement,
      );
    }

    dropHandledRef.current = false;
    setDraggedItemId(null);
    setDropIndicator(null);
  };

  const completeItemDrop = (
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
  ) => {
    dropHandledRef.current = true;
    setDraggedItemId(null);
    setDropIndicator(null);
    void reorderItem(draggedId, targetId, placement);
  };

  return {
    beginItemDrag,
    completeItemDrop,
    draggedItemId,
    dropIndicator,
    finishItemDrag,
    setDropIndicator,
  };
}
