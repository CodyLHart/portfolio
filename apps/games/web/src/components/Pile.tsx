import { useDroppable } from "@dnd-kit/core";
import { Card, PileRef, pileId, rankLabel, suitSymbol } from "../lib/solitaire";
import { CardView } from "./CardView";

type PileProps = {
  cards: Card[];
  label: string;
  pile: PileRef;
  hintCardId: string | null;
  hintDestinationCardId: string | null;
  selectedCardId: string | null;
  hintTargetPileId: string | null;
  stacked?: boolean;
  onAutoMove: (cardId: string) => void;
  onSelectCard: (cardId: string) => void;
  onSelectPile: (pile: PileRef) => void;
};

export function Pile({
  cards,
  label,
  pile,
  hintCardId,
  hintDestinationCardId,
  selectedCardId,
  hintTargetPileId,
  stacked = false,
  onAutoMove,
  onSelectCard,
  onSelectPile,
}: PileProps) {
  const { isOver, setNodeRef } = useDroppable({
    data: {
      pile,
    },
    id: pileId(pile),
  });
  const topCard = cards[cards.length - 1];
  const id = pileId(pile);
  const selectedIndex = stacked
    ? cards.findIndex((card) => card.id === selectedCardId)
    : -1;
  const hintedIndex =
    stacked && selectedIndex < 0 ? cards.findIndex((card) => card.id === hintCardId) : -1;
  const visibleWasteCards =
    pile.kind === "waste" ? cards.slice(-3) : topCard ? [topCard] : [];

  return (
    <button
      aria-label={label}
      className={[
        stacked ? "pile tableau-pile" : "pile",
        stacked && cards.length === 0 ? "empty-tableau-pile" : "",
        isOver ? "drop-over" : "",
        hintTargetPileId === id ? "hint-target" : "",
      ].join(" ")}
      onClick={() => onSelectPile(pile)}
      ref={setNodeRef}
      type="button"
    >
      {cards.length === 0 && !stacked ? <span className="pile-placeholder">{label}</span> : null}
      {cards.length === 0 && stacked ? <span className="empty-tableau-placeholder" /> : null}
      {stacked
        ? cards.map((card, index) => (
            <CardView
              card={card}
              isHinted={hintDestinationCardId === card.id}
              isSelected={false}
              isTop={index === cards.length - 1}
              key={card.id}
              onDoubleClick={() => onAutoMove(card.id)}
              onSelect={() => onSelectCard(card.id)}
              style={{ top: `calc(${index} * var(--stack-offset))` }}
            />
          ))
        : visibleWasteCards.map((card, index) => (
              <CardView
                card={card}
                isHinted={hintCardId === card.id || hintDestinationCardId === card.id}
                isSelected={selectedCardId === card.id}
                isTop={index === visibleWasteCards.length - 1}
                key={card.id}
                onDoubleClick={() => onAutoMove(card.id)}
                onSelect={() => onSelectCard(card.id)}
                style={
                  pile.kind === "waste"
                    ? { left: `calc(${index} * var(--waste-offset))` }
                    : undefined
                }
              />
            ))}
      {selectedIndex >= 0 ? (
        <span
          aria-hidden="true"
          className="selected-stack"
          style={{
            height: `calc(var(--card-height) + (${cards.length - selectedIndex - 1} * var(--stack-offset)))`,
            top: `calc(${selectedIndex} * var(--stack-offset))`,
          }}
        />
      ) : null}
      {hintedIndex >= 0 ? (
        <span
          aria-hidden="true"
          className="hinted-stack"
          style={{
            height: `calc(var(--card-height) + (${cards.length - hintedIndex - 1} * var(--stack-offset)))`,
            top: `calc(${hintedIndex} * var(--stack-offset))`,
          }}
        />
      ) : null}
      {!stacked && topCard?.faceUp ? (
        <span className="foundation-mini">
          {rankLabel(topCard.rank)}
          {suitSymbol(topCard.suit)}
        </span>
      ) : null}
    </button>
  );
}
