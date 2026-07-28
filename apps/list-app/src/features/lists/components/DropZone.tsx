import { useState } from "react";
import type { DropIndicator, DropPlacement } from "../types";

export function DropZone({
  canDrop,
  completeItemDrop,
  draggedItemId,
  itemId,
  label,
  placement,
  setDropIndicator,
}: {
  canDrop: boolean;
  completeItemDrop: (
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
  ) => void;
  draggedItemId: string | null;
  itemId: string;
  label: string;
  placement: DropPlacement;
  setDropIndicator: (indicator: DropIndicator) => void;
}) {
  const [isActive, setIsActive] = useState(false);

  if (!canDrop) {
    return null;
  }

  return (
    <div
      aria-label={`Drop item at ${label}`}
      className={`edge-drop-zone ${isActive && draggedItemId ? "active" : ""}`}
      onDragLeave={() => setIsActive(false)}
      onDragOver={(event) => {
        if (draggedItemId && draggedItemId !== itemId) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          setIsActive(true);
          setDropIndicator({ itemId, placement });
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        const droppedId =
          event.dataTransfer.getData("text/plain") || draggedItemId;
        setIsActive(false);

        if (droppedId) {
          completeItemDrop(droppedId, itemId, placement);
        }
      }}
    />
  );
}
