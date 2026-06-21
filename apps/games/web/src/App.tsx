import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { ArrowLeft, BarChart3, Lightbulb, RotateCcw, Settings, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MinesweeperGame } from "./components/MinesweeperGame";
import { Pile } from "./components/Pile";
import { formatScore, formatSeconds } from "./lib/format";
import { pileId } from "./lib/solitaire";
import { useSolitaireStore } from "./lib/store";
import "./styles.css";

const portfolioUrl = import.meta.env.VITE_PORTFOLIO_URL ?? "http://127.0.0.1:3000";
type ActiveGame = "menu" | "minesweeper" | "solitaire";

export default function App() {
  const [activeGame, setActiveGame] = useState<ActiveGame>("menu");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const statsMenuRef = useRef<HTMLDivElement>(null);
  const {
    autoMove,
    backToMenu: backToSolitaireMenu,
    dragMove,
    drawStock,
    game,
    history,
    hints,
    hintCardId,
    hintDestinationCardId,
    hintTargetPileId,
    message,
    moveSelectedTo,
    newGame,
    openGame: openSolitaire,
    selectCard,
    selectedCardId,
    setDrawMode,
    setScoringMode,
    showHint,
    stats,
    tick,
    undo,
  } = useSolitaireStore();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

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

  const handleDragEnd = (event: DragEndEvent) => {
    const cardId = event.active.data.current?.cardId as string | undefined;
    const pile = event.over?.data.current?.pile;

    if (!cardId || !pile) {
      return;
    }

    dragMove(cardId, pile);
  };

  const backToMenu = () => {
    backToSolitaireMenu();
    setActiveGame("menu");
  };

  const openSolitaireGame = () => {
    openSolitaire();
    setActiveGame("solitaire");
  };

  return (
    <div className="app-shell">
      <header className="portfolio-header">
        <a className="header-logo" href={portfolioUrl} aria-label="Cody Hart home">
          <span>CODY</span>
          <span>HART</span>
        </a>
        <nav className="header-nav" aria-label="Navigation">
          <a className="portfolio-link" href={portfolioUrl}>
            Portfolio
          </a>
        </nav>
      </header>

      <main className="app-main bg-yellow-500/50 mix-blend-multiply">
        {activeGame === "menu" ? (
          <div className="menu-layout">
            <section className="panel menu-hero">
              <p className="eyebrow">Games</p>
              <h1>Playable browser games built as independent apps.</h1>
            </section>
            <button className="game-card" onClick={openSolitaireGame} type="button">
              <div>
                <p className="eyebrow">Klondike</p>
                <h2>Solitaire</h2>
                <p>
                  Draw 1 or 3, standard or Vegas scoring, tap-to-move,
                  drag/drop, undo, and persisted stats.
                </p>
              </div>
              <span>Play</span>
            </button>
            <button className="game-card" onClick={() => setActiveGame("minesweeper")} type="button">
              <div>
                <p className="eyebrow">Classic</p>
                <h2>Minesweeper</h2>
                <p>
                  Beginner, intermediate, advanced, and custom boards with
                  first-click safety, flags, long-press mobile controls, and
                  persisted stats.
                </p>
              </div>
              <span>Play</span>
            </button>
          </div>
        ) : activeGame === "minesweeper" ? (
          <MinesweeperGame onBack={backToMenu} />
        ) : (
          <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
            <div className="game-layout">
              <section className="panel game-toolbar">
                <button className="text-button" onClick={backToMenu} type="button">
                  <ArrowLeft size={18} />
                  Games
                </button>
                <div className="toolbar-title">
                  <p className="eyebrow">Klondike</p>
                  <h1>Solitaire</h1>
                </div>
              </section>

              <section className="panel score-panel">
                <div>
                  <p className="eyebrow">Score</p>
                  <strong>{formatScore(game.score, game.settings.scoringMode)}</strong>
                </div>
                <div>
                  <p className="eyebrow">Moves</p>
                  <strong>{game.moves}</strong>
                </div>
                <div>
                  <p className="eyebrow">Time</p>
                  <strong>{formatSeconds(game.elapsedSeconds)}</strong>
                </div>
                <div className="toolbar-actions score-actions">
                  <button disabled={history.length === 0} onClick={undo} type="button">
                    <Undo2 size={18} />
                    Undo
                  </button>
                  <button onClick={showHint} type="button">
                    <Lightbulb size={18} />
                    Hint
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
                      <div className="settings-popover">
                        <div>
                          <p className="eyebrow">Draw</p>
                          <div className="segmented-control">
                            <button
                              className={game.settings.drawMode === 1 ? "active" : ""}
                              onClick={() => setDrawMode(1)}
                              type="button"
                            >
                              1
                            </button>
                            <button
                              className={game.settings.drawMode === 3 ? "active" : ""}
                              onClick={() => setDrawMode(3)}
                              type="button"
                            >
                              3
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="eyebrow">Scoring</p>
                          <div className="segmented-control scoring-control">
                            {(["standard", "vegas"] as const).map((mode) => (
                              <button
                                className={game.settings.scoringMode === mode ? "active" : ""}
                                key={mode}
                                onClick={() => setScoringMode(mode)}
                                type="button"
                              >
                                {mode === "standard" ? "Standard" : "Vegas"}
                              </button>
                            ))}
                          </div>
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
                            <dd>{stats.gamesPlayed}</dd>
                          </div>
                          <div>
                            <dt>Won</dt>
                            <dd>{stats.gamesWon}</dd>
                          </div>
                          <div>
                            <dt>Win rate</dt>
                            <dd>
                              {stats.gamesPlayed === 0
                                ? "0%"
                                : `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%`}
                            </dd>
                          </div>
                          <div>
                            <dt>Best time</dt>
                            <dd>{stats.bestSeconds === null ? "—" : formatSeconds(stats.bestSeconds)}</dd>
                          </div>
                          <div>
                            <dt>Fewest moves</dt>
                            <dd>{stats.fewestMoves ?? "—"}</dd>
                          </div>
                        </dl>
                        {message ? <p className="status-message">{message}</p> : null}
                        {hints.length > 0 ? (
                          <ol className="hint-list" aria-label="Available moves">
                            {hints.map((hint, index) => (
                              <li key={`${hint}-${index}`}>{hint}</li>
                            ))}
                          </ol>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <button onClick={() => newGame()} type="button">
                    <RotateCcw size={18} />
                    New
                  </button>
                </div>
              </section>

              <section className="table-panel">
                <div className="board-top">
                  <button
                    className={[
                      "pile stock-pile",
                      hintTargetPileId === pileId({ kind: "stock" }) ? "hint-target" : "",
                    ].join(" ")}
                    onClick={drawStock}
                    type="button"
                  >
                    {game.stock.length > 0 ? <span className="card face-down stock-card">CH</span> : null}
                    {game.stock.length === 0 ? (
                      <span className="pile-placeholder stock-refresh" aria-hidden="true">
                        <RotateCcw size={24} />
                      </span>
                    ) : null}
                  </button>
                  <Pile
                    cards={game.waste}
                    label="Waste"
                    hintCardId={hintCardId}
                    hintDestinationCardId={hintDestinationCardId}
                    hintTargetPileId={hintTargetPileId}
                    onAutoMove={autoMove}
                    onSelectCard={selectCard}
                    onSelectPile={moveSelectedTo}
                    pile={{ kind: "waste" }}
                    selectedCardId={selectedCardId}
                  />
                  <div className="foundation-row">
                    {game.foundations.map((pile, index) => (
                      <Pile
                        cards={pile}
                        key={pileId({ kind: "foundation", index })}
                        label="A"
                        hintCardId={hintCardId}
                        hintDestinationCardId={hintDestinationCardId}
                        hintTargetPileId={hintTargetPileId}
                        onAutoMove={autoMove}
                        onSelectCard={selectCard}
                        onSelectPile={moveSelectedTo}
                        pile={{ kind: "foundation", index }}
                        selectedCardId={selectedCardId}
                      />
                    ))}
                  </div>
                </div>

                <div className="tableau-row">
                  {game.tableau.map((pile, index) => (
                    <Pile
                      cards={pile}
                      key={pileId({ kind: "tableau", index })}
                      label={`${index + 1}`}
                      hintCardId={hintCardId}
                      hintDestinationCardId={hintDestinationCardId}
                      hintTargetPileId={hintTargetPileId}
                      onAutoMove={autoMove}
                      onSelectCard={selectCard}
                      onSelectPile={moveSelectedTo}
                      pile={{ kind: "tableau", index }}
                      selectedCardId={selectedCardId}
                      stacked
                    />
                  ))}
                </div>
              </section>
            </div>
          </DndContext>
        )}
      </main>
    </div>
  );
}
