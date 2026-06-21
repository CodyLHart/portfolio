import { useDraggable } from "@dnd-kit/core";
import { motion } from "motion/react";
import { Card, rankLabel, suitSymbol } from "../lib/solitaire";

type CardViewProps = {
  card: Card;
  isHinted: boolean;
  isSelected: boolean;
  isTop: boolean;
  onDoubleClick: () => void;
  onSelect: () => void;
  style?: React.CSSProperties;
};

export function CardView({
  card,
  isHinted,
  isSelected,
  isTop,
  onDoubleClick,
  onSelect,
  style,
}: CardViewProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    data: {
      cardId: card.id,
    },
    disabled: !card.faceUp,
    id: card.id,
  });
  const colorClass =
    card.suit === "diamonds" || card.suit === "hearts" ? "card-red" : "card-black";
  const dragStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <motion.button
      animate={{ opacity: isDragging ? 0.45 : 1 }}
      aria-label={card.faceUp ? `${rankLabel(card.rank)} of ${card.suit}` : "Face-down card"}
      className={[
        "card",
        card.faceUp ? "face-up" : "face-down",
        card.faceUp ? colorClass : "",
        isHinted && !isSelected ? "hinted" : "",
        isSelected ? "selected" : "",
        isTop ? "top-card" : "",
      ].join(" ")}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onDoubleClick();
      }}
      ref={setNodeRef}
      style={{ ...style, ...dragStyle }}
      type="button"
      {...listeners}
      {...attributes}
    >
      {card.faceUp ? (
        <>
          <span className="card-rank top-left">{rankLabel(card.rank)}</span>
          <span className="card-suit top-right">{suitSymbol(card.suit)}</span>
          <strong>{suitSymbol(card.suit)}</strong>
          <span className="card-rank bottom-right">{rankLabel(card.rank)}</span>
          <span className="card-suit bottom-left">{suitSymbol(card.suit)}</span>
        </>
      ) : (
        <span className="card-back-mark">CH</span>
      )}
    </motion.button>
  );
}
