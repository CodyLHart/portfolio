import { formatDate } from "../../../lib/format";
import type { List } from "../../../lib/types";
import { getDropPlacement } from "../lib/list-utils";
import type { DropPlacement, ListDropIndicator } from "../types";

export function ListRow({
  activeListId,
  completedCount,
  draggedListId,
  itemCount,
  list,
  listCount,
  listDropIndicator,
  onDragEnd,
  onDragStart,
  onDropList,
  onSelect,
  setListDropIndicator,
}: {
  activeListId: string | null;
  completedCount: number | null;
  draggedListId: string | null;
  itemCount: number | null;
  list: List;
  listCount: number;
  listDropIndicator: ListDropIndicator;
  onDragEnd: () => void;
  onDragStart: (listId: string) => void;
  onDropList: (
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
  ) => void;
  onSelect: (listId: string) => void;
  setListDropIndicator: (indicator: ListDropIndicator) => void;
}) {
  const isDropTarget = listDropIndicator?.listId === list.id;

  return (
    <div>
      {isDropTarget && listDropIndicator.placement === "before" ? (
        <div className="drop-indicator" />
      ) : null}
      <div
        className={[
          list.id === activeListId ? "list-nav-row active" : "list-nav-row",
          draggedListId === list.id ? "dragging" : "",
        ].join(" ")}
        draggable={listCount > 1}
        onDragEnd={onDragEnd}
        onDragOver={(event) => {
          if (draggedListId && draggedListId !== list.id) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setListDropIndicator({
              listId: list.id,
              placement: getDropPlacement(
                event.clientY,
                event.currentTarget.getBoundingClientRect(),
              ),
            });
          }
        }}
        onDragStart={(event) => {
          onDragStart(list.id);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", list.id);
        }}
        onDrop={(event) => {
          event.preventDefault();
          const droppedId =
            event.dataTransfer.getData("text/plain") || draggedListId;
          const placement = getDropPlacement(
            event.clientY,
            event.currentTarget.getBoundingClientRect(),
          );

          if (droppedId) {
            onDropList(droppedId, list.id, placement);
          }

          onDragEnd();
        }}
      >
        <span
          aria-hidden="true"
          className={`drag-handle ${listCount > 1 ? "" : "disabled"}`}
        >
          ::
        </span>
        <button
          className="list-nav-title"
          onClick={() => onSelect(list.id)}
          type="button"
        >
          <strong>{list.title}</strong>
          <span>
            {itemCount === null
              ? `Updated ${formatDate(list.updated_at)}`
              : `${itemCount} item${itemCount === 1 ? "" : "s"}${
                  completedCount ? `, ${completedCount} completed` : ""
                }`}
          </span>
        </button>
        <span aria-hidden="true" className="list-row-chevron">
          &rsaquo;
        </span>
      </div>
      {isDropTarget && listDropIndicator.placement === "after" ? (
        <div className="drop-indicator" />
      ) : null}
    </div>
  );
}
