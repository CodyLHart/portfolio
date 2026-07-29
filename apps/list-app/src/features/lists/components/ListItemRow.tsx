import { useState } from "react";
import { AppIcon } from "../../../components/ui/AppIcon";
import { formatDate } from "../../../lib/format";
import type {
  Collaborator,
  ListItem,
  ListItemFields,
} from "../../../lib/types";
import { getCategoryStyle, getDropPlacement } from "../lib/list-utils";
import type { DropIndicator, DropPlacement } from "../types";

export function ListItemRow({
  beginItemDrag,
  canDrag,
  canEdit,
  collaborators,
  completeItemDrop,
  deleteItem,
  draggedItemId,
  dropIndicator,
  finishItemDrag,
  item,
  itemFields,
  listId,
  setDropIndicator,
  setEditingItem,
  toggleCategoryFilter,
  toggleItem,
}: {
  beginItemDrag: (itemId: string) => void;
  canDrag: boolean;
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
  item: ListItem;
  itemFields: ListItemFields;
  listId: string;
  setDropIndicator: (indicator: DropIndicator) => void;
  setEditingItem: (item: ListItem) => void;
  toggleCategoryFilter: (category: string) => void;
  toggleItem: (item: ListItem) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const assignee = collaborators.find(
    (collaborator) => collaborator.user_id === item.assigned_to,
  )?.profile;
  const isDraggable = canEdit && canDrag;
  const isDropTarget = dropIndicator?.itemId === item.id;

  return (
    <>
      {isDropTarget && dropIndicator.placement === "before" ? (
        <div className="drop-indicator" />
      ) : null}
      <article
        className={`item-card ${item.completed ? "completed" : ""} ${
          itemFields.notes && item.notes ? "has-note" : ""
        } ${draggedItemId === item.id ? "dragging" : ""}`}
        draggable={isDraggable}
        onDragEnd={finishItemDrag}
        onDragOver={(event) => {
          if (isDraggable && draggedItemId && draggedItemId !== item.id) {
            const rect = event.currentTarget.getBoundingClientRect();
            const placement = getDropPlacement(event.clientY, rect);
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setDropIndicator({ itemId: item.id, placement });
          }
        }}
        onDragStart={(event) => {
          if (!isDraggable) {
            return;
          }

          beginItemDrag(item.id);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", item.id);
        }}
        onDrop={(event) => {
          event.preventDefault();
          const droppedId =
            event.dataTransfer.getData("text/plain") || draggedItemId;
          const placement = getDropPlacement(
            event.clientY,
            event.currentTarget.getBoundingClientRect(),
          );

          if (droppedId) {
            completeItemDrop(droppedId, item.id, placement);
          }
        }}
      >
        <span
          aria-hidden="true"
          className={`drag-handle ${isDraggable ? "" : "disabled"}`}
        >
          <AppIcon fixedWidth icon="fa-solid fa-grip-vertical" />
        </span>
        <input
          checked={item.completed}
          disabled={!canEdit}
          onChange={() => toggleItem(item)}
          type="checkbox"
        />
        <div className="item-main">
          <div className="item-title">
            <span>{item.title}</span>
            {itemFields.quantity && item.quantity ? (
              <span className="quantity-pill">Qty {item.quantity}</span>
            ) : null}
          </div>
          {itemFields.notes && item.notes ? (
            <p className="item-note">{item.notes}</p>
          ) : null}
        </div>
        <div className="item-right">
          <div className="item-meta">
            {itemFields.category && item.category ? (
              <button
                className="category-pill"
                onClick={() => toggleCategoryFilter(item.category ?? "")}
                style={getCategoryStyle(listId, item.category)}
                type="button"
              >
                {item.category}
              </button>
            ) : null}
            {itemFields.priority && item.priority ? (
              <span>{item.priority}</span>
            ) : null}
            {itemFields.dueDate && item.due_date ? (
              <span>{formatDate(item.due_date)}</span>
            ) : null}
            {itemFields.assignee && assignee ? (
              <span>{assignee.display_name}</span>
            ) : null}
          </div>
          <div className="item-menu">
            <button
              aria-label={`Open actions for ${item.title}`}
              className="secondary-button"
              disabled={!canEdit}
              onBlur={() => window.setTimeout(() => setIsMenuOpen(false), 120)}
              onClick={() => setIsMenuOpen((open) => !open)}
              type="button"
            >
              <AppIcon icon="fa-solid fa-ellipsis" />
            </button>
            {isMenuOpen ? (
              <div className="item-menu-panel">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setEditingItem(item);
                  }}
                  type="button"
                >
                  <AppIcon fixedWidth icon="fa-solid fa-pen" />
                  Edit
                </button>
                <button
                  className="danger-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void deleteItem(item);
                  }}
                  type="button"
                >
                  <AppIcon fixedWidth icon="fa-solid fa-trash" />
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </article>
      {isDropTarget && dropIndicator.placement === "after" ? (
        <div className="drop-indicator" />
      ) : null}
    </>
  );
}
