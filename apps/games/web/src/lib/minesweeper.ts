export type MinesweeperDifficulty = "beginner" | "intermediate" | "advanced" | "custom";
export type MinesweeperStatus = "ready" | "playing" | "won" | "lost";

export type MinesweeperSettings = {
  difficulty: MinesweeperDifficulty;
  width: number;
  height: number;
  mines: number;
};

export type MineCell = {
  adjacentMines: number;
  flagged: boolean;
  id: string;
  mine: boolean;
  revealed: boolean;
  x: number;
  y: number;
};

export type MinesweeperGame = {
  cells: MineCell[];
  elapsedSeconds: number;
  firstReveal: boolean;
  flagsUsed: number;
  minesRemaining: number;
  settings: MinesweeperSettings;
  startedAt: number | null;
  status: MinesweeperStatus;
};

export type MinesweeperStatsBucket = {
  bestSeconds: number | null;
  gamesPlayed: number;
  gamesWon: number;
};

export type MinesweeperStats = Record<MinesweeperDifficulty, MinesweeperStatsBucket>;

export const difficultyPresets = {
  beginner: {
    difficulty: "beginner",
    height: 9,
    mines: 10,
    width: 9,
  },
  intermediate: {
    difficulty: "intermediate",
    height: 16,
    mines: 40,
    width: 16,
  },
  advanced: {
    difficulty: "advanced",
    height: 16,
    mines: 99,
    width: 30,
  },
} satisfies Record<Exclude<MinesweeperDifficulty, "custom">, MinesweeperSettings>;

export const defaultCustomSettings: MinesweeperSettings = {
  difficulty: "custom",
  height: 12,
  mines: 25,
  width: 12,
};

export const defaultMinesweeperStats: MinesweeperStats = {
  advanced: { bestSeconds: null, gamesPlayed: 0, gamesWon: 0 },
  beginner: { bestSeconds: null, gamesPlayed: 0, gamesWon: 0 },
  custom: { bestSeconds: null, gamesPlayed: 0, gamesWon: 0 },
  intermediate: { bestSeconds: null, gamesPlayed: 0, gamesWon: 0 },
};

export const clampMinesweeperSettings = (
  settings: Partial<MinesweeperSettings>,
): MinesweeperSettings => {
  const width = clampNumber(settings.width ?? defaultCustomSettings.width, 5, 40);
  const height = clampNumber(settings.height ?? defaultCustomSettings.height, 5, 30);
  const maxMines = width * height - 1;

  return {
    difficulty: settings.difficulty ?? "custom",
    height,
    mines: clampNumber(settings.mines ?? defaultCustomSettings.mines, 1, maxMines),
    width,
  };
};

export const createMinesweeperGame = (
  settings: MinesweeperSettings,
): MinesweeperGame => ({
  cells: createEmptyCells(settings.width, settings.height),
  elapsedSeconds: 0,
  firstReveal: true,
  flagsUsed: 0,
  minesRemaining: settings.mines,
  settings,
  startedAt: null,
  status: "ready",
});

export const revealCell = (
  game: MinesweeperGame,
  cellId: string,
): MinesweeperGame => {
  if (game.status === "won" || game.status === "lost") {
    return game;
  }

  const cell = game.cells.find((candidate) => candidate.id === cellId);
  if (!cell || cell.flagged || cell.revealed) {
    return game;
  }

  const activeGame = game.firstReveal ? placeMines(game, cell) : game;
  const activeCell = activeGame.cells.find((candidate) => candidate.id === cellId);

  if (!activeCell) {
    return game;
  }

  const next = {
    ...activeGame,
    cells: activeGame.cells.map((candidate) => ({ ...candidate })),
    firstReveal: false,
    startedAt: activeGame.startedAt ?? Date.now(),
    status: "playing" as MinesweeperStatus,
  };
  const nextCell = next.cells.find((candidate) => candidate.id === cellId);

  if (!nextCell) {
    return game;
  }

  if (nextCell.mine) {
    return {
      ...next,
      cells: next.cells.map((candidate) =>
        candidate.mine ? { ...candidate, revealed: true } : candidate,
      ),
      status: "lost",
    };
  }

  revealSafeArea(next, nextCell);

  if (hasWon(next)) {
    return completeWin(next);
  }

  return next;
};

export const toggleFlag = (
  game: MinesweeperGame,
  cellId: string,
): MinesweeperGame => {
  if (game.status === "won" || game.status === "lost") {
    return game;
  }

  const cell = game.cells.find((candidate) => candidate.id === cellId);
  if (!cell || cell.revealed) {
    return game;
  }

  const nextCells = game.cells.map((candidate) =>
    candidate.id === cellId ? { ...candidate, flagged: !candidate.flagged } : candidate,
  );
  const flagsUsed = nextCells.filter((candidate) => candidate.flagged).length;

  return {
    ...game,
    cells: nextCells,
    flagsUsed,
    minesRemaining: game.settings.mines - flagsUsed,
  };
};

export const tickMinesweeper = (game: MinesweeperGame): MinesweeperGame => {
  if (game.status !== "playing" || game.startedAt === null) {
    return game;
  }

  return {
    ...game,
    elapsedSeconds: Math.max(
      game.elapsedSeconds,
      Math.floor((Date.now() - game.startedAt) / 1000),
    ),
  };
};

export const cellGlyph = (cell: MineCell) => {
  if (!cell.revealed) {
    return cell.flagged ? "⚑" : "";
  }

  if (cell.mine) {
    return "✹";
  }

  return cell.adjacentMines === 0 ? "" : String(cell.adjacentMines);
};

const createEmptyCells = (width: number, height: number): MineCell[] =>
  Array.from({ length: width * height }, (_, index) => {
    const x = index % width;
    const y = Math.floor(index / width);

    return {
      adjacentMines: 0,
      flagged: false,
      id: `${x}-${y}`,
      mine: false,
      revealed: false,
      x,
      y,
    };
  });

const placeMines = (game: MinesweeperGame, firstCell: MineCell): MinesweeperGame => {
  const mineIds = new Set<string>();
  const availableCells = game.cells.filter((cell) => cell.id !== firstCell.id);

  while (mineIds.size < game.settings.mines) {
    const cell = availableCells[Math.floor(Math.random() * availableCells.length)];
    mineIds.add(cell.id);
  }

  const cells = game.cells.map((cell) => ({
    ...cell,
    mine: mineIds.has(cell.id),
  }));

  return {
    ...game,
    cells: cells.map((cell) => ({
      ...cell,
      adjacentMines: countAdjacentMines(cells, game.settings.width, game.settings.height, cell),
    })),
  };
};

const revealSafeArea = (game: MinesweeperGame, startCell: MineCell) => {
  const queue = [startCell];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const cell = queue.shift();
    if (!cell || visited.has(cell.id)) {
      continue;
    }

    visited.add(cell.id);
    const current = game.cells.find((candidate) => candidate.id === cell.id);
    if (!current || current.flagged || current.revealed) {
      continue;
    }

    current.revealed = true;

    if (current.adjacentMines !== 0) {
      continue;
    }

    getNeighbors(game.cells, game.settings.width, game.settings.height, current).forEach(
      (neighbor) => {
        if (!neighbor.mine && !neighbor.revealed && !neighbor.flagged) {
          queue.push(neighbor);
        }
      },
    );
  }
};

const hasWon = (game: MinesweeperGame) =>
  game.cells.every((cell) => cell.mine || cell.revealed);

const completeWin = (game: MinesweeperGame): MinesweeperGame => {
  const cells = game.cells.map((cell) =>
    cell.mine ? { ...cell, flagged: true } : cell,
  );

  return {
    ...game,
    cells,
    flagsUsed: game.settings.mines,
    minesRemaining: 0,
    status: "won",
  };
};

const countAdjacentMines = (
  cells: MineCell[],
  width: number,
  height: number,
  cell: MineCell,
) =>
  getNeighbors(cells, width, height, cell).filter((neighbor) => neighbor.mine).length;

const getNeighbors = (
  cells: MineCell[],
  width: number,
  height: number,
  cell: MineCell,
) => {
  const neighbors: MineCell[] = [];

  for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
    for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
      if (xOffset === 0 && yOffset === 0) {
        continue;
      }

      const x = cell.x + xOffset;
      const y = cell.y + yOffset;

      if (x < 0 || y < 0 || x >= width || y >= height) {
        continue;
      }

      const neighbor = cells[y * width + x];
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }
  }

  return neighbors;
};

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(Number.isFinite(value) ? value : min)));
