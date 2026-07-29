import type { Dispatch, SetStateAction } from "react";
import type { List } from "../../../lib/types";
import type { DropPlacement, ListDropIndicator } from "../types";
import { ListsIndex } from "./ListsIndex";

export function ListsSidebar({
  activeListId,
  draggedListId,
  isLoading,
  listDropIndicator,
  lists,
  onCreateList,
  onReorderListByDrop,
  onSelectActiveList,
  setDraggedListId,
  setListDropIndicator,
}: {
  activeListId: string | null;
  draggedListId: string | null;
  isLoading: boolean;
  listDropIndicator: ListDropIndicator;
  lists: List[];
  onCreateList: () => void;
  onReorderListByDrop: (
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
  ) => void;
  onSelectActiveList: (listId: string) => void;
  setDraggedListId: Dispatch<SetStateAction<string | null>>;
  setListDropIndicator: Dispatch<SetStateAction<ListDropIndicator>>;
}) {
  return (
    <aside className="sidebar panel">
      <ListsIndex
        activeListId={activeListId}
        draggedListId={draggedListId}
        isLoading={isLoading}
        listDropIndicator={listDropIndicator}
        lists={lists}
        onCreateList={onCreateList}
        onReorderListByDrop={onReorderListByDrop}
        onSelectActiveList={onSelectActiveList}
        setDraggedListId={setDraggedListId}
        setListDropIndicator={setListDropIndicator}
      />
    </aside>
  );
}
