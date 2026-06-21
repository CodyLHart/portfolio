import { create } from "zustand";
import {
  autoMoveToFoundation,
  cloneState,
  createNewGame,
  drawFromStock,
  DrawMode,
  findCard,
  findHints,
  GameState,
  moveCards,
  pileId,
  PileRef,
  ScoringMode,
  SolitaireSettings,
  SolitaireStats,
} from "./solitaire";

const statsKey = "portfolio-games-solitaire-stats";
const settingsKey = "portfolio-games-solitaire-settings";

const defaultSettings: SolitaireSettings = {
  drawMode: 1,
  scoringMode: "standard",
};

const defaultStats: SolitaireStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  bestSeconds: null,
  fewestMoves: null,
};

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const normalizeSettings = (settings: Partial<SolitaireSettings>): SolitaireSettings => ({
  drawMode: settings.drawMode === 3 ? 3 : 1,
  scoringMode: settings.scoringMode === "vegas" ? "vegas" : "standard",
});

const loadSettings = () =>
  typeof localStorage === "undefined"
    ? defaultSettings
    : normalizeSettings(readJson<Partial<SolitaireSettings>>(settingsKey, defaultSettings));

const loadStats = () =>
  typeof localStorage === "undefined"
    ? defaultStats
    : readJson<SolitaireStats>(statsKey, defaultStats);

type SolitaireStore = {
  activeGame: "menu" | "solitaire";
  game: GameState;
  history: GameState[];
  stats: SolitaireStats;
  selectedCardId: string | null;
  hintCardId: string | null;
  hintDestinationCardId: string | null;
  hintTargetPileId: string | null;
  hints: string[];
  message: string | null;
  openGame: () => void;
  backToMenu: () => void;
  newGame: (settings?: Partial<SolitaireSettings>) => void;
  setDrawMode: (drawMode: DrawMode) => void;
  setScoringMode: (scoringMode: ScoringMode) => void;
  drawStock: () => void;
  selectCard: (cardId: string) => void;
  moveSelectedTo: (pile: PileRef) => void;
  dragMove: (cardId: string, to: PileRef) => void;
  autoMove: (cardId: string) => void;
  undo: () => void;
  showHint: () => void;
  tick: () => void;
};

const settings = loadSettings();
const stats = loadStats();

const withHistory = (history: GameState[], game: GameState) => [
  ...history.slice(-29),
  cloneState(game),
];

const updateStatsForWin = (game: GameState, stats: SolitaireStats): SolitaireStats => {
  const next = {
    ...stats,
    gamesWon: stats.gamesWon + 1,
    bestSeconds:
      stats.bestSeconds === null
        ? game.elapsedSeconds
        : Math.min(stats.bestSeconds, game.elapsedSeconds),
    fewestMoves:
      stats.fewestMoves === null ? game.moves : Math.min(stats.fewestMoves, game.moves),
  };

  writeJson(statsKey, next);
  return next;
};

const maybeWin = (game: GameState, stats: SolitaireStats) => {
  if (!game.won) {
    return { game, stats, message: null };
  }

  return {
    game,
    stats: updateStatsForWin(game, stats),
    message: "You won. Nicely played.",
  };
};

export const useSolitaireStore = create<SolitaireStore>((set, get) => ({
  activeGame: "menu",
  game: createNewGame(settings),
  history: [],
  stats,
  selectedCardId: null,
  hintCardId: null,
  hintDestinationCardId: null,
  hintTargetPileId: null,
  hints: [],
  message: null,
  openGame: () => set({ activeGame: "solitaire" }),
  backToMenu: () =>
    set({
      activeGame: "menu",
      selectedCardId: null,
      hintCardId: null,
      hintDestinationCardId: null,
      hintTargetPileId: null,
      hints: [],
    }),
  newGame: (settingsPatch) => {
    const current = get();
    const nextSettings = {
      ...current.game.settings,
      ...settingsPatch,
    };
    const nextStats = {
      ...current.stats,
      gamesPlayed: current.stats.gamesPlayed + 1,
    };

    writeJson(settingsKey, nextSettings);
    writeJson(statsKey, nextStats);

    set({
      game: createNewGame(nextSettings),
      history: [],
      stats: nextStats,
      selectedCardId: null,
      hintCardId: null,
      hintDestinationCardId: null,
      hintTargetPileId: null,
      hints: [],
      message: null,
    });
  },
  setDrawMode: (drawMode) => get().newGame({ drawMode }),
  setScoringMode: (scoringMode) => get().newGame({ scoringMode }),
  drawStock: () => {
    const current = get();
    const next = drawFromStock(current.game);

    if (next === current.game) {
      return;
    }

    set({
      game: next,
      history: withHistory(current.history, current.game),
      selectedCardId: null,
      hintCardId: null,
      hintDestinationCardId: null,
      hintTargetPileId: null,
      hints: [],
      message: null,
    });
  },
  selectCard: (cardId) => {
    const current = get();

    const clicked = findCard(current.game, cardId);

    if (current.selectedCardId && current.selectedCardId !== cardId && clicked) {
      const selected = findCard(current.game, current.selectedCardId);

      if (selected && (clicked.pile.kind === "tableau" || clicked.pile.kind === "foundation")) {
        const result = moveCards(current.game, {
          from: selected.pile,
          to: clicked.pile,
          cardId: current.selectedCardId,
        });

        if (result.moved) {
          const win = maybeWin(result.state, current.stats);
          set({
            game: win.game,
            stats: win.stats,
            history: withHistory(current.history, current.game),
            selectedCardId: null,
            hintCardId: null,
            hintDestinationCardId: null,
            hintTargetPileId: null,
            hints: [],
            message: win.message,
          });
          return;
        }
      }
    }

    if (current.selectedCardId === cardId) {
      const result = autoMoveToFoundation(current.game, cardId);
      if (result.moved) {
        const win = maybeWin(result.state, current.stats);
        set({
          game: win.game,
          stats: win.stats,
          history: withHistory(current.history, current.game),
          selectedCardId: null,
          hintCardId: null,
          hintDestinationCardId: null,
          hintTargetPileId: null,
          hints: [],
          message: win.message,
        });
      } else {
        set({
          selectedCardId: null,
          hintCardId: null,
          hintDestinationCardId: null,
          hintTargetPileId: null,
          hints: [],
          message: result.reason,
        });
      }
      return;
    }

    const found = clicked;
    const pile = found ? (found.pile.kind === "tableau" ? current.game.tableau[found.pile.index ?? 0] : null) : null;
    const card = pile ? pile[found?.index ?? 0] : null;

    if (found && found.pile.kind === "tableau" && !card?.faceUp) {
      set({
        hintCardId: null,
        hintDestinationCardId: null,
        hintTargetPileId: null,
        hints: [],
        message: "Only face-up cards can move.",
      });
      return;
    }

    set({
      selectedCardId: cardId,
      hintCardId: null,
      hintDestinationCardId: null,
      hintTargetPileId: null,
      hints: [],
      message: null,
    });
  },
  moveSelectedTo: (pile) => {
    const current = get();

    if (!current.selectedCardId) {
      return;
    }

    const found = findCard(current.game, current.selectedCardId);
    if (!found) {
      set({
        selectedCardId: null,
        hintCardId: null,
        hintDestinationCardId: null,
        hintTargetPileId: null,
        hints: [],
      });
      return;
    }

    const result = moveCards(current.game, {
      from: found.pile,
      to: pile,
      cardId: current.selectedCardId,
    });

    if (!result.moved) {
      set({
        hintCardId: null,
        hintDestinationCardId: null,
        hintTargetPileId: null,
        hints: [],
        message: result.reason,
      });
      return;
    }

    const win = maybeWin(result.state, current.stats);
    set({
      game: win.game,
      stats: win.stats,
      history: withHistory(current.history, current.game),
      selectedCardId: null,
      hintCardId: null,
      hintDestinationCardId: null,
      hintTargetPileId: null,
      hints: [],
      message: win.message,
    });
  },
  dragMove: (cardId, to) => {
    const current = get();
    const found = findCard(current.game, cardId);

    if (!found) {
      return;
    }

    const result = moveCards(current.game, {
      from: found.pile,
      to,
      cardId,
    });

    if (!result.moved) {
      set({
        hintCardId: null,
        hintDestinationCardId: null,
        hintTargetPileId: null,
        hints: [],
        message: result.reason,
      });
      return;
    }

    const win = maybeWin(result.state, current.stats);
    set({
      game: win.game,
      stats: win.stats,
      history: withHistory(current.history, current.game),
      selectedCardId: null,
      hintCardId: null,
      hintDestinationCardId: null,
      hintTargetPileId: null,
      hints: [],
      message: win.message,
    });
  },
  autoMove: (cardId) => {
    const current = get();
    const result = autoMoveToFoundation(current.game, cardId);

    if (!result.moved) {
      set({
        hintCardId: null,
        hintDestinationCardId: null,
        hintTargetPileId: null,
        hints: [],
        message: result.reason,
      });
      return;
    }

    const win = maybeWin(result.state, current.stats);
    set({
      game: win.game,
      stats: win.stats,
      history: withHistory(current.history, current.game),
      selectedCardId: null,
      hintCardId: null,
      hintDestinationCardId: null,
      hintTargetPileId: null,
      hints: [],
      message: win.message,
    });
  },
  undo: () => {
    const current = get();
    const previous = current.history[current.history.length - 1];

    if (!previous) {
      return;
    }

    set({
      game: previous,
      history: current.history.slice(0, -1),
      selectedCardId: null,
      hintCardId: null,
      hintDestinationCardId: null,
      hintTargetPileId: null,
      hints: [],
      message: null,
    });
  },
  showHint: () => {
    const current = get();
    const availableHints = findHints(current.game);
    const hint = availableHints[0];

    if (!hint) {
      set({
        hintCardId: null,
        hintDestinationCardId: null,
        hintTargetPileId: null,
        hints: [],
        message: "No available moves found.",
        selectedCardId: null,
      });
      return;
    }

    const destinationCard =
      hint.move?.to.kind === "tableau"
        ? current.game.tableau[hint.move.to.index ?? 0]?.at(-1)
        : null;

    set({
      hintCardId: hint.move?.cardId ?? null,
      hintDestinationCardId: destinationCard?.id ?? null,
      hintTargetPileId: hint.target
        ? pileId(hint.target)
        : hint.move && !destinationCard
          ? pileId(hint.move.to)
          : null,
      hints: availableHints.map((availableHint) => availableHint.message),
      message:
        availableHints.length === 1
          ? "1 available move."
          : `${availableHints.length} available moves.`,
      selectedCardId: null,
    });
  },
  tick: () => {
    const current = get();

    if (current.activeGame !== "solitaire" || current.game.won) {
      return;
    }

    set({
      game: {
        ...current.game,
        elapsedSeconds: Math.max(
          current.game.elapsedSeconds,
          Math.floor((Date.now() - current.game.startedAt) / 1000),
        ),
      },
    });
  },
}));
