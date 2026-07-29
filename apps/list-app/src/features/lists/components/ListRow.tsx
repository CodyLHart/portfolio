import { AppIcon } from "../../../components/ui/AppIcon";
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
  completedCount: number;
  draggedListId: string | null;
  itemCount: number;
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
        <div className="flex items-center">
          <span
            aria-hidden="true"
            className={`drag-handle ${listCount > 1 ? "" : "disabled"}`}
          >
            <AppIcon fixedWidth icon="fa-solid fa-grip-vertical" />
          </span>
          <button
            className="list-nav-title"
            onClick={() => onSelect(list.id)}
            type="button"
          >
            <strong>{list.title}</strong>
            <span className="list-row-counts">
              {itemCount} item{itemCount === 1 ? "" : "s"} &middot;{" "}
              {completedCount} completed
            </span>
            <span className="list-row-updated">
              Updated {formatDate(list.updated_at)}
            </span>
          </button>
        </div>
        <span aria-hidden="true" className="list-row-chevron">
          <AppIcon icon="fa-solid fa-chevron-right" />
        </span>
      </div>
      {isDropTarget && listDropIndicator.placement === "after" ? (
        <div className="drop-indicator" />
      ) : null}
    </div>
  );
}
