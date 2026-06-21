import { create } from "zustand";
import {
  clampMinesweeperSettings,
  createMinesweeperGame,
  defaultCustomSettings,
  defaultMinesweeperStats,
  difficultyPresets,
  MinesweeperDifficulty,
  MinesweeperGame,
  MinesweeperSettings,
  MinesweeperStats,
  revealCell,
  tickMinesweeper,
  toggleFlag,
} from "./minesweeper";

const settingsKey = "portfolio-games-minesweeper-settings";
const statsKey = "portfolio-games-minesweeper-stats";

type MinesweeperStore = {
  customDraft: MinesweeperSettings;
  flagMode: boolean;
  game: MinesweeperGame;
  stats: MinesweeperStats;
  applyCustomSettings: (settings: Partial<MinesweeperSettings>) => void;
  newGame: (settings?: MinesweeperSettings) => void;
  reveal: (cellId: string) => void;
  setDifficulty: (difficulty: MinesweeperDifficulty) => void;
  tick: () => void;
  toggleFlagMode: () => void;
  toggleFlagged: (cellId: string) => void;
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

const loadSettings = () =>
  typeof localStorage === "undefined"
    ? difficultyPresets.beginner
    : normalizeSettings(readJson<Partial<MinesweeperSettings>>(settingsKey, difficultyPresets.beginner));

const loadStats = () =>
  typeof localStorage === "undefined"
    ? defaultMinesweeperStats
    : { ...defaultMinesweeperStats, ...readJson<Partial<MinesweeperStats>>(statsKey, {}) };

const normalizeSettings = (settings: Partial<MinesweeperSettings>): MinesweeperSettings => {
  if (
    settings.difficulty &&
    settings.difficulty !== "custom" &&
    settings.difficulty in difficultyPresets
  ) {
    return difficultyPresets[settings.difficulty];
  }

  return clampMinesweeperSettings({
    ...defaultCustomSettings,
    ...settings,
    difficulty: "custom",
  });
};

const updateStatsForStartedGame = (
  stats: MinesweeperStats,
  difficulty: MinesweeperDifficulty,
) => {
  const next = {
    ...stats,
    [difficulty]: {
      ...stats[difficulty],
      gamesPlayed: stats[difficulty].gamesPlayed + 1,
    },
  };

  writeJson(statsKey, next);
  return next;
};

const updateStatsForWin = (stats: MinesweeperStats, game: MinesweeperGame) => {
  const bucket = stats[game.settings.difficulty];
  const next = {
    ...stats,
    [game.settings.difficulty]: {
      ...bucket,
      bestSeconds:
        bucket.bestSeconds === null
          ? game.elapsedSeconds
          : Math.min(bucket.bestSeconds, game.elapsedSeconds),
      gamesWon: bucket.gamesWon + 1,
    },
  };

  writeJson(statsKey, next);
  return next;
};

const settings = loadSettings();
const stats = loadStats();

export const useMinesweeperStore = create<MinesweeperStore>((set, get) => ({
  customDraft:
    settings.difficulty === "custom"
      ? settings
      : defaultCustomSettings,
  flagMode: false,
  game: createMinesweeperGame(settings),
  stats,
  applyCustomSettings: (settingsPatch) => {
    const next = clampMinesweeperSettings({
      ...get().customDraft,
      ...settingsPatch,
      difficulty: "custom",
    });

    set({ customDraft: next });
  },
  newGame: (settingsPatch) => {
    const currentSettings = settingsPatch ?? get().game.settings;
    const nextSettings = normalizeSettings(currentSettings);

    writeJson(settingsKey, nextSettings);

    set({
      flagMode: false,
      game: createMinesweeperGame(nextSettings),
    });
  },
  reveal: (cellId) => {
    const current = get();

    if (current.flagMode) {
      get().toggleFlagged(cellId);
      return;
    }

    const wasReady = current.game.status === "ready";
    const wasWon = current.game.status === "won";
    const revealedGame = revealCell(current.game, cellId);

    if (revealedGame === current.game) {
      return;
    }

    const nextGame =
      (revealedGame.status === "won" || revealedGame.status === "lost") &&
      revealedGame.startedAt !== null
        ? {
            ...revealedGame,
            elapsedSeconds: Math.max(
              revealedGame.elapsedSeconds,
              Math.floor((Date.now() - revealedGame.startedAt) / 1000),
            ),
          }
        : revealedGame;

    const nextStats = wasReady && nextGame.status !== "ready"
      ? updateStatsForStartedGame(current.stats, nextGame.settings.difficulty)
      : current.stats;

    set({
      game: nextGame,
      stats: !wasWon && nextGame.status === "won"
        ? updateStatsForWin(nextStats, nextGame)
        : nextStats,
    });
  },
  setDifficulty: (difficulty) => {
    const nextSettings =
      difficulty === "custom" ? get().customDraft : difficultyPresets[difficulty];

    get().newGame(nextSettings);
  },
  tick: () => {
    const current = get();
    const nextGame = tickMinesweeper(current.game);

    if (nextGame !== current.game) {
      set({ game: nextGame });
    }
  },
  toggleFlagMode: () => set((state) => ({ flagMode: !state.flagMode })),
  toggleFlagged: (cellId) => {
    const current = get();
    const nextGame = toggleFlag(current.game, cellId);

    if (nextGame !== current.game) {
      set({ game: nextGame });
    }
  },
}));
