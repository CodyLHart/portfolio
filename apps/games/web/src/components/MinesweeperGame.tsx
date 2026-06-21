import { ArrowLeft, BarChart3, Flag, RotateCcw, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cellGlyph, MinesweeperDifficulty } from "../lib/minesweeper";
import { useMinesweeperStore } from "../lib/minesweeperStore";
import { formatSeconds } from "../lib/format";

type MinesweeperGameProps = {
  onBack: () => void;
};

const difficultyLabels: Record<MinesweeperDifficulty, string> = {
  advanced: "Advanced",
  beginner: "Beginner",
  custom: "Custom",
  intermediate: "Intermediate",
};

export function MinesweeperGame({ onBack }: MinesweeperGameProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const {
    applyCustomSettings,
    customDraft,
    flagMode,
    game,
    newGame,
    reveal,
    setDifficulty,
    stats,
    tick,
    toggleFlagMode,
    toggleFlagged,
  } = useMinesweeperStore();
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const statsMenuRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const currentStats = stats[game.settings.difficulty];
  const isCustom = game.settings.difficulty === "custom";
  const visibleSettings = isCustom ? customDraft : game.settings;

  useEffect(() => {
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    if (!isSettingsOpen && !isStatsOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        isSettingsOpen &&
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(target)
      ) {
        setIsSettingsOpen(false);
      }

      if (
        isStatsOpen &&
        statsMenuRef.current &&
        !statsMenuRef.current.contains(target)
      ) {
        setIsStatsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSettingsOpen(false);
        setIsStatsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSettingsOpen, isStatsOpen]);

  const handlePointerDown = (cellId: string) => {
    longPressTriggeredRef.current = false;
    window.clearTimeout(longPressTimerRef.current ?? undefined);
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      toggleFlagged(cellId);
    }, 450);
  };

  const handlePointerUp = () => {
    window.clearTimeout(longPressTimerRef.current ?? undefined);
  };

  const handleCellClick = (cellId: string) => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    reveal(cellId);
  };

  const handleCustomChange = (field: "height" | "mines" | "width", value: string) => {
    applyCustomSettings({ [field]: Number(value) });
  };

  return (
    <div className="minesweeper-layout">
      <section className="panel game-toolbar minesweeper-toolbar">
        <button className="text-button" onClick={onBack} type="button">
          <ArrowLeft size={18} />
          Games
        </button>
        <div className="toolbar-title">
          <p className="eyebrow">Classic</p>
          <h1>Minesweeper</h1>
        </div>
      </section>

      <section className="panel score-panel mine-score-panel">
        <div>
          <p className="eyebrow">Mines</p>
          <strong>{game.minesRemaining}</strong>
        </div>
        <div>
          <p className="eyebrow">Time</p>
          <strong>{formatSeconds(game.elapsedSeconds)}</strong>
        </div>
        <div>
          <p className="eyebrow">Status</p>
          <strong>{statusLabel(game.status)}</strong>
        </div>
        <div className="toolbar-actions score-actions">
          <button
            aria-pressed={flagMode}
            className={flagMode ? "active-action" : ""}
            onClick={toggleFlagMode}
            type="button"
          >
            <Flag size={18} />
            Flag
          </button>
          <div className="settings-menu" ref={settingsMenuRef}>
            <button
              aria-expanded={isSettingsOpen}
              aria-label="Game settings"
              className="icon-button"
              onClick={() => setIsSettingsOpen((isOpen) => !isOpen)}
              type="button"
            >
              <Settings size={18} />
            </button>
            {isSettingsOpen ? (
              <div className="settings-popover mine-settings-popover">
                <div>
                  <p className="eyebrow">Difficulty</p>
                  <div className="segmented-control mine-difficulty-control">
                    {(["beginner", "intermediate", "advanced", "custom"] as const).map((difficulty) => (
                      <button
                        className={game.settings.difficulty === difficulty ? "active" : ""}
                        key={difficulty}
                        onClick={() => setDifficulty(difficulty)}
                        type="button"
                      >
                        {difficultyLabels[difficulty]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mine-custom-controls">
                  <label>
                    <span>Width</span>
                    <input
                      disabled={!isCustom}
                      max={40}
                      min={5}
                      onChange={(event) => handleCustomChange("width", event.target.value)}
                      type="number"
                      value={visibleSettings.width}
                    />
                  </label>
                  <label>
                    <span>Height</span>
                    <input
                      disabled={!isCustom}
                      max={30}
                      min={5}
                      onChange={(event) => handleCustomChange("height", event.target.value)}
                      type="number"
                      value={visibleSettings.height}
                    />
                  </label>
                  <label>
                    <span>Mines</span>
                    <input
                      disabled={!isCustom}
                      max={visibleSettings.width * visibleSettings.height - 1}
                      min={1}
                      onChange={(event) => handleCustomChange("mines", event.target.value)}
                      type="number"
                      value={visibleSettings.mines}
                    />
                  </label>
                  <button disabled={!isCustom} onClick={() => newGame(customDraft)} type="button">
                    Apply
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="settings-menu" ref={statsMenuRef}>
            <button
              aria-expanded={isStatsOpen}
              aria-label="Game stats"
              className="icon-button"
              onClick={() => setIsStatsOpen((isOpen) => !isOpen)}
              type="button"
            >
              <BarChart3 size={18} />
            </button>
            {isStatsOpen ? (
              <div className="settings-popover stats-popover">
                <p className="eyebrow">Stats</p>
                <dl>
                  <div>
                    <dt>Played</dt>
                    <dd>{currentStats.gamesPlayed}</dd>
                  </div>
                  <div>
                    <dt>Won</dt>
                    <dd>{currentStats.gamesWon}</dd>
                  </div>
                  <div>
                    <dt>Win rate</dt>
                    <dd>
                      {currentStats.gamesPlayed === 0
                        ? "0%"
                        : `${Math.round((currentStats.gamesWon / currentStats.gamesPlayed) * 100)}%`}
                    </dd>
                  </div>
                  <div>
                    <dt>Best time</dt>
                    <dd>
                      {currentStats.bestSeconds === null
                        ? "—"
                        : formatSeconds(currentStats.bestSeconds)}
                    </dd>
                  </div>
                </dl>
                <p className="status-message">
                  {game.status === "ready"
                    ? "First click is always safe."
                    : game.status === "won"
                      ? "You cleared the board."
                      : game.status === "lost"
                        ? "Mine hit. Start a new board when you're ready."
                        : flagMode
                          ? "Flag mode is on."
                          : "Clear every safe cell."}
                </p>
              </div>
            ) : null}
          </div>
          <button onClick={() => newGame()} type="button">
            <RotateCcw size={18} />
            New
          </button>
        </div>
      </section>

      <section className="mine-board-panel">
        <div
          className="mine-board"
          style={{
            gridTemplateColumns: `repeat(${game.settings.width}, var(--mine-cell-size))`,
          }}
        >
          {game.cells.map((cell) => (
            <button
              aria-label={cellAriaLabel(cell)}
              className={[
                "mine-cell",
                cell.revealed ? "revealed" : "",
                cell.flagged ? "flagged" : "",
                cell.mine && cell.revealed ? "mine-hit" : "",
                cell.revealed && cell.adjacentMines > 0
                  ? `mine-count-${cell.adjacentMines}`
                  : "",
              ].join(" ")}
              key={cell.id}
              onClick={() => handleCellClick(cell.id)}
              onContextMenu={(event) => {
                event.preventDefault();
                toggleFlagged(cell.id);
              }}
              onPointerCancel={handlePointerUp}
              onPointerDown={() => handlePointerDown(cell.id)}
              onPointerLeave={handlePointerUp}
              onPointerUp={handlePointerUp}
              type="button"
            >
              {cellGlyph(cell)}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

const statusLabel = (status: string) => {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "playing") {
    return "Playing";
  }

  if (status === "won") {
    return "Won";
  }

  return "Lost";
};

const cellAriaLabel = (cell: { adjacentMines: number; flagged: boolean; mine: boolean; revealed: boolean }) => {
  if (cell.flagged) {
    return "Flagged cell";
  }

  if (!cell.revealed) {
    return "Hidden cell";
  }

  if (cell.mine) {
    return "Mine";
  }

  return cell.adjacentMines === 0
    ? "Empty revealed cell"
    : `${cell.adjacentMines} adjacent mines`;
};
