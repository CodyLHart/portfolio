import type { Dispatch, SetStateAction } from "react";
import type {
  Collaborator,
  ListItem,
  ListItemFields,
} from "../../../lib/types";
import { getCategoryStyle } from "../lib/list-utils";
import type { DropIndicator, DropPlacement, ItemGroup } from "../types";
import { DropZone } from "./DropZone";
import { ListItemRow } from "./ListItemRow";

export function ListItems({
  activeListId,
  beginItemDrag,
  canEdit,
  collaborators,
  completeItemDrop,
  deleteItem,
  draggedItemId,
  dropIndicator,
  finishItemDrag,
  itemFields,
  items,
  selectedCategories,
  setDropIndicator,
  setEditingItem,
  setIsAddItemOpen,
  toggleCategoryFilter,
  toggleItem,
  visibleItemGroups,
}: {
  activeListId: string;
  beginItemDrag: (itemId: string) => void;
  canEdit: boolean;
  collaborators: Collaborator[];
  completeItemDrop: (
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
  ) => void;
  deleteItem: (item: ListItem) => void;
  draggedItemId: string | null;
  dropIndicator: DropIndicator;
  finishItemDrag: () => void;
  itemFields: ListItemFields;
  items: ListItem[];
  selectedCategories: string[];
  setDropIndicator: Dispatch<SetStateAction<DropIndicator>>;
  setEditingItem: Dispatch<SetStateAction<ListItem | null>>;
  setIsAddItemOpen: Dispatch<SetStateAction<boolean>>;
  toggleCategoryFilter: (category: string) => void;
  toggleItem: (item: ListItem) => void;
  visibleItemGroups: ItemGroup[];
}) {
  return (
    <div className="items">
      {items.length === 0 ? (
        <div className="empty-state">
          <h2>This list is empty</h2>
          <p>Add the first item whenever you&apos;re ready.</p>
          <button
            className="secondary-button"
            disabled={!canEdit}
            onClick={() => setIsAddItemOpen(true)}
            type="button"
          >
            Add item
          </button>
        </div>
      ) : (
        visibleItemGroups.map((group) => (
          <div className="category-group" key={group.category ?? "manual"}>
            {group.category ? (
              <h2 className="category-heading">
                <span style={getCategoryStyle(activeListId, group.category)}>
                  {group.category}
                </span>
              </h2>
            ) : null}
            {group.items.length > 0 && selectedCategories.length === 0 ? (
              <DropZone
                canDrop={canEdit}
                completeItemDrop={completeItemDrop}
                draggedItemId={draggedItemId}
                itemId={group.items[0].id}
                label="top"
                placement="before"
                setDropIndicator={setDropIndicator}
              />
            ) : null}
            {group.items.map((item) => (
              <ListItemRow
                beginItemDrag={beginItemDrag}
                canDrag={selectedCategories.length === 0}
                canEdit={canEdit}
                collaborators={collaborators}
                completeItemDrop={completeItemDrop}
                deleteItem={deleteItem}
                draggedItemId={draggedItemId}
                dropIndicator={dropIndicator}
                finishItemDrag={finishItemDrag}
                item={item}
                itemFields={itemFields}
                key={item.id}
                listId={activeListId}
                setDropIndicator={setDropIndicator}
                setEditingItem={setEditingItem}
                toggleCategoryFilter={toggleCategoryFilter}
                toggleItem={toggleItem}
              />
            ))}
            {group.items.length > 0 && selectedCategories.length === 0 ? (
              <DropZone
                canDrop={canEdit}
                completeItemDrop={completeItemDrop}
                draggedItemId={draggedItemId}
                itemId={group.items[group.items.length - 1].id}
                label="bottom"
                placement="after"
                setDropIndicator={setDropIndicator}
              />
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
