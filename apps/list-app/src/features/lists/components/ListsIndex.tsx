import type { Dispatch, SetStateAction } from "react";
import { AppIcon } from "../../../components/ui/AppIcon";
import type { List, ListItem } from "../../../lib/types";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import type { DropPlacement, ListDropIndicator } from "../types";
import { ListRow } from "./ListRow";

export function ListsIndex({
  activeListId,
  canCreate = true,
  draggedListId,
  isLoading,
  items,
  listDropIndicator,
  lists,
  onCreateList,
  onReorderListByDrop,
  onSelectActiveList,
  setDraggedListId,
  setListDropIndicator,
}: {
  activeListId: string | null;
  canCreate?: boolean;
  draggedListId: string | null;
  isLoading: boolean;
  items: ListItem[];
  listDropIndicator: ListDropIndicator;
  lists: List[];
  onCreateList: (() => void) | null;
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
    <>
      <div className="toolbar">
        <div>
          <h2>Your lists</h2>
        </div>
        <button
          aria-label="Create list"
          className="icon-button"
          disabled={!canCreate}
          onClick={onCreateList ?? undefined}
          type="button"
        >
          <AppIcon icon="fa-solid fa-plus" />
        </button>
      </div>
      {!isLoading && lists.length === 0 ? (
        <div className="empty-state list-index-empty">
          <h2>No lists yet</h2>
          <p>Create your first list to start keeping things organized.</p>
          <button
            className="primary-button"
            disabled={!canCreate}
            onClick={onCreateList ?? undefined}
            type="button"
          >
            Create list
          </button>
        </div>
      ) : null}
      <nav className="list-nav" aria-label="Lists">
        {isLoading && lists.length === 0 ? (
          <LoadingSpinner label="Loading lists" />
        ) : null}
        {lists.map((list) => {
          const isSelected = list.id === activeListId;
          const itemCount = isSelected ? items.length : null;
          const completedCount = isSelected
            ? items.filter((item) => item.completed).length
            : null;

          return (
            <ListRow
              activeListId={activeListId}
              completedCount={completedCount}
              draggedListId={draggedListId}
              itemCount={itemCount}
              key={list.id}
              list={list}
              listCount={lists.length}
              listDropIndicator={listDropIndicator}
              onDragEnd={() => {
                setDraggedListId(null);
                setListDropIndicator(null);
              }}
              onDragStart={setDraggedListId}
              onDropList={onReorderListByDrop}
              onSelect={onSelectActiveList}
              setListDropIndicator={setListDropIndicator}
            />
          );
        })}
      </nav>
    </>
  );
}
