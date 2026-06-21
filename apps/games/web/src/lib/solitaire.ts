export type Suit = "clubs" | "diamonds" | "hearts" | "spades";
export type Color = "black" | "red";
export type DrawMode = 1 | 3;
export type ScoringMode = "standard" | "vegas";
export type PileKind = "stock" | "waste" | "foundation" | "tableau";

export type Card = {
  id: string;
  suit: Suit;
  rank: number;
  faceUp: boolean;
};

export type PileRef = {
  kind: PileKind;
  index?: number;
};

export type Move = {
  from: PileRef;
  to: PileRef;
  cardId: string;
};

export type Hint = {
  move?: Move;
  message: string;
  target?: PileRef;
};

export type SolitaireSettings = {
  drawMode: DrawMode;
  scoringMode: ScoringMode;
};

export type SolitaireStats = {
  gamesPlayed: number;
  gamesWon: number;
  bestSeconds: number | null;
  fewestMoves: number | null;
};

export type GameState = {
  settings: SolitaireSettings;
  stock: Card[];
  waste: Card[];
  foundations: Card[][];
  tableau: Card[][];
  score: number;
  moves: number;
  stockPasses: number;
  startedAt: number;
  elapsedSeconds: number;
  won: boolean;
};

export type MoveResult =
  | {
      state: GameState;
      moved: true;
    }
  | {
      state: GameState;
      moved: false;
      reason: string;
    };

const suits: Suit[] = ["clubs", "diamonds", "hearts", "spades"];

export const rankLabel = (rank: number) => {
  if (rank === 1) {
    return "A";
  }

  if (rank === 11) {
    return "J";
  }

  if (rank === 12) {
    return "Q";
  }

  if (rank === 13) {
    return "K";
  }

  return String(rank);
};

export const suitSymbol = (suit: Suit) => {
  if (suit === "clubs") {
    return "♣";
  }

  if (suit === "diamonds") {
    return "♦";
  }

  if (suit === "hearts") {
    return "♥";
  }

  return "♠";
};

export const cardColor = (card: Card): Color =>
  card.suit === "diamonds" || card.suit === "hearts" ? "red" : "black";

export const createDeck = () =>
  suits.flatMap((suit) =>
    Array.from({ length: 13 }, (_, index) => {
      const rank = index + 1;

      return {
        id: `${suit}-${rank}`,
        suit,
        rank,
        faceUp: false,
      };
    }),
  );

const shuffle = (cards: Card[]) => {
  const next = [...cards];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const cloneCard = (card: Card): Card => ({ ...card });

export const cloneState = (state: GameState): GameState => ({
  ...state,
  stock: state.stock.map(cloneCard),
  waste: state.waste.map(cloneCard),
  foundations: state.foundations.map((pile) => pile.map(cloneCard)),
  tableau: state.tableau.map((pile) => pile.map(cloneCard)),
});

export const createNewGame = (settings: SolitaireSettings): GameState => {
  const deck = shuffle(createDeck());
  const tableau = Array.from({ length: 7 }, (_, pileIndex) => {
    const pile = deck.splice(0, pileIndex + 1);
    pile[pile.length - 1].faceUp = true;
    return pile;
  });
  const score = settings.scoringMode === "standard" ? 0 : -52;

  return {
    settings,
    stock: deck,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    score,
    moves: 0,
    stockPasses: 0,
    startedAt: Date.now(),
    elapsedSeconds: 0,
    won: false,
  };
};

export const getPile = (state: GameState, ref: PileRef): Card[] => {
  if (ref.kind === "stock") {
    return state.stock;
  }

  if (ref.kind === "waste") {
    return state.waste;
  }

  if (ref.kind === "foundation") {
    return state.foundations[ref.index ?? 0];
  }

  return state.tableau[ref.index ?? 0];
};

const getMutablePile = (state: GameState, ref: PileRef): Card[] => getPile(state, ref);

export const pileId = (ref: PileRef) => `${ref.kind}-${ref.index ?? 0}`;

export const isSamePile = (first: PileRef, second: PileRef) =>
  first.kind === second.kind && (first.index ?? 0) === (second.index ?? 0);

export const parsePileId = (id: string): PileRef => {
  const [kind, index] = id.split("-");
  return {
    kind: kind as PileKind,
    index: Number(index),
  };
};

const scoreMove = (state: GameState, move: Move, movedCards: Card[]) => {
  if (state.settings.scoringMode === "standard") {
    if (move.to.kind === "foundation") {
      return state.score + 10;
    }

    if (move.from.kind === "waste" && move.to.kind === "tableau") {
      return state.score + 5;
    }

    if (move.from.kind === "foundation" && move.to.kind === "tableau") {
      return state.score - 15;
    }

    return state.score;
  }

  if (move.to.kind === "foundation") {
    return state.score + 5 * movedCards.length;
  }

  return state.score;
};

const revealTableauTop = (state: GameState, ref: PileRef) => {
  if (ref.kind !== "tableau" || ref.index === undefined) {
    return false;
  }

  const pile = state.tableau[ref.index];
  const topCard = pile[pile.length - 1];

  if (topCard && !topCard.faceUp) {
    topCard.faceUp = true;
    if (state.settings.scoringMode === "standard") {
      state.score += 5;
    }
    return true;
  }

  return false;
};

const canMoveToFoundation = (card: Card, destination: Card[]) => {
  const topCard = destination[destination.length - 1];

  if (!topCard) {
    return card.rank === 1;
  }

  return topCard.suit === card.suit && card.rank === topCard.rank + 1;
};

const canMoveToTableau = (card: Card, destination: Card[]) => {
  const topCard = destination[destination.length - 1];

  if (!topCard) {
    return card.rank === 13;
  }

  return topCard.faceUp && cardColor(topCard) !== cardColor(card) && card.rank === topCard.rank - 1;
};

export const cardLabel = (card: Card) => `${rankLabel(card.rank)}${suitSymbol(card.suit)}`;

export const pileLabel = (pile: PileRef) => {
  if (pile.kind === "waste") {
    return "the waste";
  }

  if (pile.kind === "foundation") {
    return `foundation ${Number(pile.index ?? 0) + 1}`;
  }

  if (pile.kind === "tableau") {
    return `column ${Number(pile.index ?? 0) + 1}`;
  }

  return "the stock";
};

export const findCard = (state: GameState, cardId: string) => {
  const wasteIndex = state.waste.findIndex((card) => card.id === cardId);
  if (wasteIndex >= 0) {
    return { pile: { kind: "waste" } satisfies PileRef, index: wasteIndex };
  }

  for (let index = 0; index < state.foundations.length; index += 1) {
    const cardIndex = state.foundations[index].findIndex((card) => card.id === cardId);
    if (cardIndex >= 0) {
      return { pile: { kind: "foundation", index } satisfies PileRef, index: cardIndex };
    }
  }

  for (let index = 0; index < state.tableau.length; index += 1) {
    const cardIndex = state.tableau[index].findIndex((card) => card.id === cardId);
    if (cardIndex >= 0) {
      return { pile: { kind: "tableau", index } satisfies PileRef, index: cardIndex };
    }
  }

  return null;
};

export const getMovableCards = (state: GameState, from: PileRef, cardId: string) => {
  const source = getPile(state, from);
  const cardIndex = source.findIndex((card) => card.id === cardId);

  if (cardIndex < 0) {
    return [];
  }

  if (from.kind === "waste" || from.kind === "foundation") {
    return cardIndex === source.length - 1 ? [source[cardIndex]] : [];
  }

  if (from.kind === "tableau") {
    const cards = source.slice(cardIndex);
    return cards.every((card) => card.faceUp) ? cards : [];
  }

  return [];
};

export const moveCards = (state: GameState, move: Move): MoveResult => {
  const next = cloneState(state);
  const source = getMutablePile(next, move.from);
  const destination = getMutablePile(next, move.to);
  const cardIndex = source.findIndex((card) => card.id === move.cardId);

  if (cardIndex < 0) {
    return { state, moved: false, reason: "Card not found." };
  }

  const movingCards =
    move.from.kind === "tableau" ? source.slice(cardIndex) : source.slice(cardIndex, cardIndex + 1);
  const leadCard = movingCards[0];

  if ((move.from.kind === "waste" || move.from.kind === "foundation") && cardIndex !== source.length - 1) {
    return { state, moved: false, reason: "Only the top card can move from that pile." };
  }

  if (!leadCard?.faceUp) {
    return { state, moved: false, reason: "Only face-up cards can move." };
  }

  if (move.to.kind === "foundation") {
    if (movingCards.length !== 1 || !canMoveToFoundation(leadCard, destination)) {
      return { state, moved: false, reason: "That card cannot move to the foundation." };
    }
  } else if (move.to.kind === "tableau") {
    if (!canMoveToTableau(leadCard, destination)) {
      return { state, moved: false, reason: "That card cannot move to the tableau." };
    }
  } else {
    return { state, moved: false, reason: "Cards can only move to tableau or foundation piles." };
  }

  source.splice(cardIndex, movingCards.length);
  destination.push(...movingCards);
  next.score = scoreMove(next, move, movingCards);
  next.moves += 1;
  revealTableauTop(next, move.from);
  next.won = next.foundations.every((pile) => pile.length === 13);

  return { state: next, moved: true };
};

const movableSources = (state: GameState) => {
  const sources: Move[] = [];
  const wasteTop = state.waste[state.waste.length - 1];

  if (wasteTop) {
    sources.push({
      cardId: wasteTop.id,
      from: { kind: "waste" },
      to: { kind: "foundation", index: 0 },
    });
  }

  state.foundations.forEach((pile, index) => {
    const topCard = pile[pile.length - 1];
    if (topCard) {
      sources.push({
        cardId: topCard.id,
        from: { kind: "foundation", index },
        to: { kind: "tableau", index: 0 },
      });
    }
  });

  state.tableau.forEach((pile, pileIndex) => {
    pile.forEach((card) => {
      if (card.faceUp) {
        sources.push({
          cardId: card.id,
          from: { kind: "tableau", index: pileIndex },
          to: { kind: "foundation", index: 0 },
        });
      }
    });
  });

  return sources.map(({ cardId, from }) => ({ cardId, from }));
};

const tableauMoveCreatesUsefulChange = (
  state: GameState,
  move: Move,
  result: MoveResult,
) => {
  if (!result.moved || move.from.kind !== "tableau") {
    return true;
  }

  const sourcePile = getPile(state, move.from);
  const movingCardIndex = sourcePile.findIndex((card) => card.id === move.cardId);
  const leadCard = sourcePile[movingCardIndex];
  const destination = getPile(state, move.to);

  if (leadCard?.rank === 13) {
    return movingCardIndex > 0 && destination.length === 0;
  }

  if (movingCardIndex === 0) {
    return true;
  }

  const uncoveredCard = sourcePile[movingCardIndex - 1];

  if (!uncoveredCard?.faceUp) {
    return false;
  }

  return state.foundations.some((_, index) =>
    moveCards(result.state, {
      cardId: uncoveredCard.id,
      from: move.from,
      to: { kind: "foundation", index },
    }).moved,
  );
};

export const findHints = (state: GameState): Hint[] => {
  const hints: Hint[] = [];
  const sources = movableSources(state);

  for (const source of sources) {
    if (source.from.kind === "foundation") {
      continue;
    }

    for (let index = 0; index < state.foundations.length; index += 1) {
      const to = { kind: "foundation", index } satisfies PileRef;
      const move = {
        ...source,
        to,
      };
      const result = moveCards(state, move);

      if (result.moved) {
        const card = getPile(state, source.from).find((candidate) => candidate.id === source.cardId);
        hints.push({
          move: { ...source, to },
          message: card
            ? `Move ${cardLabel(card)} from ${pileLabel(source.from)} to the foundation.`
            : "Move a card to the foundation.",
        });
        break;
      }
    }
  }

  for (const source of sources) {
    if (source.from.kind === "foundation") {
      continue;
    }

    const sourceCard = getPile(state, source.from).find(
      (candidate) => candidate.id === source.cardId,
    );

    for (let index = 0; index < state.tableau.length; index += 1) {
      const to = { kind: "tableau", index } satisfies PileRef;

      if (isSamePile(source.from, to)) {
        continue;
      }

      const move = {
        ...source,
        to,
      };
      const result = moveCards(state, move);

      if (result.moved && tableauMoveCreatesUsefulChange(state, move, result)) {
        hints.push({
          move: { ...source, to },
          message: sourceCard
            ? `Move ${cardLabel(sourceCard)} from ${pileLabel(source.from)} to ${pileLabel(to)}.`
            : "Move a card to another column.",
        });
      }
    }
  }

  if (hints.length === 0 && (state.stock.length > 0 || state.waste.length > 0)) {
    hints.push({
      message: state.stock.length > 0 ? "Draw from the stock." : "Recycle the waste pile.",
      target: { kind: "stock" },
    });
  }

  return hints;
};

export const drawFromStock = (state: GameState): GameState => {
  const next = cloneState(state);

  if (next.stock.length === 0) {
    if (next.waste.length === 0) {
      return state;
    }

    next.stock = next.waste
      .slice()
      .reverse()
      .map((card) => ({ ...card, faceUp: false }));
    next.waste = [];
    next.stockPasses += 1;
    next.moves += 1;

    if (next.settings.scoringMode === "standard") {
      next.score -= next.settings.drawMode === 1 ? 100 : 20;
    }

    return next;
  }

  const drawCount = Math.min(next.settings.drawMode, next.stock.length);
  const drawn = next.stock.splice(next.stock.length - drawCount, drawCount);
  next.waste.push(...drawn.map((card) => ({ ...card, faceUp: true })));
  next.moves += 1;
  return next;
};

export const autoMoveToFoundation = (state: GameState, cardId: string): MoveResult => {
  const found = findCard(state, cardId);

  if (!found) {
    return { state, moved: false, reason: "Card not found." };
  }

  const source = getPile(state, found.pile);
  const card = source[found.index];

  if (!card || found.index !== source.length - 1 || !card.faceUp) {
    return { state, moved: false, reason: "Only top face-up cards can auto-move." };
  }

  for (let index = 0; index < state.foundations.length; index += 1) {
    const result = moveCards(state, {
      from: found.pile,
      to: { kind: "foundation", index },
      cardId,
    });

    if (result.moved) {
      return result;
    }
  }

  return { state, moved: false, reason: "No legal foundation move is available." };
};
