import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
  X,
  LogIn,
  LogOut,
  RotateCcw,
  UserCircle,
} from "lucide-react";
import { HabitCalendar } from "./components/HabitCalendar";
import { HabitForm } from "./components/HabitForm";
import { HabitIcon } from "./components/HabitIcon";
import { endOfMonth, formatMonth, startOfMonth, toDateKey } from "./lib/date";
import { api } from "./lib/api";
import {
  convertTimeAmountToHabitUnit,
  defaultTimeEntryUnit,
  formatTimeAmount,
  isTimeUnit,
  TimeEntryUnit,
} from "./lib/timeUnits";
import { CurrentUser, Habit, HabitDraft, HabitEntry } from "./types/habit";
import "./styles.css";

const today = toDateKey(new Date());
const portfolioUrl = import.meta.env.VITE_PORTFOLIO_URL ?? "http://127.0.0.1:3000";

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string | undefined>();
  const [month, setMonth] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [entryDrafts, setEntryDrafts] = useState<Record<string, string>>({});
  const [entryNoteDrafts, setEntryNoteDrafts] = useState<Record<string, string>>({});
  const [visibleNoteInputs, setVisibleNoteInputs] = useState<Record<string, boolean>>(
    {},
  );
  const [entryUnitDrafts, setEntryUnitDrafts] = useState<
    Record<string, TimeEntryUnit>
  >({});

  const loadEntries = useCallback(async (visibleMonth: Date) => {
    const from = toDateKey(startOfMonth(visibleMonth));
    const to = toDateKey(endOfMonth(visibleMonth));
    const monthEntries = await api.entries(from, to);
    setEntries(monthEntries);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const user = await api.me();

        if (!isMounted) {
          return;
        }

        setCurrentUser(user);

        if (!user) {
          setHabits([]);
          setEntries([]);
          return;
        }

        const [savedHabits, savedEntries] = await Promise.all([
          api.habits(),
          api.entries(toDateKey(startOfMonth(month)), toDateKey(endOfMonth(month))),
        ]);

        if (!isMounted) {
          return;
        }

        setHabits(savedHabits);
        setEntries(savedEntries);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load habit tracker data.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [month]);

  const selectedHabit = habits.find((habit) => habit.id === selectedHabitId);
  const selectedDateEntries = selectedDateKey
    ? entries.filter((entry) => entry.date === selectedDateKey)
    : [];
  const visibleEntries = useMemo(
    () =>
      [...entries].sort((a, b) =>
        `${b.date}-${b.id}`.localeCompare(`${a.date}-${a.id}`),
      ),
    [entries],
  );

  const totalCompletion = useMemo(() => {
    if (habits.length === 0) {
      return 0;
    }

    const completion = habits.reduce((total, habit) => {
      const amount = entries
        .filter((entry) => entry.habitId === habit.id && entry.date === today)
        .reduce((sum, entry) => sum + entry.amount, 0);

      return total + Math.min(amount / habit.targetAmount, 1);
    }, 0);

    return Math.round((completion / habits.length) * 100);
  }, [entries, habits]);

  const getPeriodRange = (frequency: Habit["frequency"], date = new Date()) => {
    const start = new Date(date);
    const end = new Date(date);

    if (frequency === "weekly") {
      start.setDate(date.getDate() - date.getDay());
      end.setDate(start.getDate() + 6);
    } else if (frequency === "monthly") {
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
    }

    return {
      from: toDateKey(start),
      to: toDateKey(end),
    };
  };

  const getHabitAmountForDate = (habitId: string, dateKey: string) =>
    entries
      .filter((entry) => entry.habitId === habitId && entry.date === dateKey)
      .reduce((sum, entry) => sum + entry.amount, 0);

  const getHabitPeriodProgress = (habit: Habit) => {
    const range = getPeriodRange(habit.frequency);
    const amount = entries
      .filter(
        (entry) =>
          entry.habitId === habit.id &&
          entry.date >= range.from &&
          entry.date <= range.to,
      )
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      amount,
      percent: Math.min(Math.round((amount / habit.targetAmount) * 100), 100),
    };
  };

  const formatHabitAmount = (amount: number, habit: Habit) =>
    isTimeUnit(habit.unit)
      ? formatTimeAmount(amount, habit.unit)
      : `${amount} ${habit.unit}`;

  const createHabit = async (draft: HabitDraft) => {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const habit = await api.createHabit(draft);
      setHabits((current) => [habit, ...current]);
      setSelectedHabitId(habit.id);
      setIsHabitModalOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create habit.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const logout = async () => {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await api.logout();
      setCurrentUser(null);
      setHabits([]);
      setEntries([]);
      setSelectedHabitId(undefined);
      setIsAccountMenuOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to log out.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const trackHabit = async (habit: Habit) => {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      const rawAmount = Number(entryDrafts[habit.id] ?? habit.targetAmount);

      if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
        setErrorMessage(`Enter a ${habit.unit} amount greater than 0.`);
        return;
      }

      const amount = isTimeUnit(habit.unit)
        ? convertTimeAmountToHabitUnit(
            rawAmount,
            entryUnitDrafts[habit.id] ?? defaultTimeEntryUnit(habit.unit),
            habit.unit,
          )
        : rawAmount;
      const note = entryNoteDrafts[habit.id]?.trim();

      const entry = await api.trackHabit(habit.id, today, amount, note || undefined);
      setEntries((current) => [{ ...entry, date: entry.date.slice(0, 10) }, ...current]);
      setEntryDrafts((current) => ({
        ...current,
        [habit.id]: "",
      }));
      setEntryNoteDrafts((current) => ({
        ...current,
        [habit.id]: "",
      }));
      setVisibleNoteInputs((current) => ({
        ...current,
        [habit.id]: false,
      }));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to track habit.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const undoEntry = async (entryId: string) => {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await api.deleteEntry(entryId);
      setEntries((current) => current.filter((entry) => entry.id !== entryId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to undo entry.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const changeMonth = async (nextMonth: Date) => {
    setMonth(nextMonth);

    if (!currentUser) {
      return;
    }

    try {
      setErrorMessage(null);
      await loadEntries(nextMonth);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load calendar.",
      );
    }
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
          {currentUser ? (
            <div className="account-menu">
              <button
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                className="avatar-button"
                onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
                type="button"
                title="User profile"
              >
                {currentUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" src={currentUser.avatarUrl} />
                ) : (
                  <UserCircle size={28} />
                )}
              </button>
              {isAccountMenuOpen ? (
                <div className="account-dropdown" role="menu">
                  <p>{currentUser.displayName}</p>
                  <button
                    disabled={isSaving}
                    onClick={logout}
                    role="menuitem"
                    type="button"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <a
              className="google-button"
              href="http://127.0.0.1:5087/api/auth/login/google?returnUrl=http%3A%2F%2F127.0.0.1%3A5173"
            >
              <LogIn size={18} />
              Google sign-in
            </a>
          )}
        </nav>
      </header>

      <main className="app-main bg-yellow-500/50 mix-blend-multiply">
        <div className="dashboard">
        <section className="panel hero-panel">
          <div>
            <p className="eyebrow">Today</p>
            <h1>Track the shape of your weeks.</h1>
            <h2>{totalCompletion}% complete</h2>
          </div>
          <div
            className="large-ring"
            style={{
              background: `conic-gradient(#0f172a ${totalCompletion}%, #e2e8f0 0)`,
            }}
          >
            <span>{totalCompletion}%</span>
          </div>
        </section>

        <section className="panel calendar-panel">
          <div className="calendar-toolbar">
            <div>
              <p className="eyebrow">
                {selectedHabit ? selectedHabit.name : "All habits"}
              </p>
              <h2>{formatMonth(month)}</h2>
            </div>
            <div className="icon-actions">
              <button
                onClick={() =>
                  changeMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
                type="button"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() =>
                  changeMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
                type="button"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <HabitCalendar
            entries={entries}
            habits={habits}
            month={month}
            onSelectDate={setSelectedDateKey}
            selectedDateKey={selectedDateKey ?? undefined}
            selectedHabitId={selectedHabitId}
          />
        </section>

        <aside className="side-column">
          {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}
          {!currentUser && !isLoading ? (
            <p className="status-message">
              Sign in with Google to load your habits and save new tracking data.
            </p>
          ) : null}

          <section className="panel habit-list">
            <div className="list-header">
              <h2>Habits</h2>
              <div className="list-actions">
                <button
                  onClick={() => setIsHabitModalOpen(true)}
                  type="button"
                >
                  <Plus size={16} />
                  Add habit
                </button>
                <button onClick={() => setSelectedHabitId(undefined)} type="button">
                  All
                </button>
              </div>
            </div>
            {isLoading ? <p className="status-message">Loading habits...</p> : null}
            {!isLoading && currentUser && habits.length === 0 ? (
              <p className="status-message">
                No habits yet. Add one to start tracking.
              </p>
            ) : null}
            {habits.map((habit) => (
              (() => {
                const progress = getHabitPeriodProgress(habit);

                return (
                  <article
                    className={
                      selectedHabitId === habit.id ? "habit active" : "habit"
                    }
                    key={habit.id}
                    onClick={() => setSelectedHabitId(habit.id)}
                  >
                    <HabitIcon color={habit.color} icon={habit.icon} />
                    <div>
                      <h3>{habit.name}</h3>
                      <p>
                        {formatHabitAmount(progress.amount, habit)} of{" "}
                        {formatHabitAmount(habit.targetAmount, habit)}/
                        {habit.frequency}
                      </p>
                      <div className="habit-progress">
                        <span style={{ width: `${progress.percent}%` }} />
                      </div>
                    </div>
                    <div
                      className={
                        isTimeUnit(habit.unit)
                          ? "track-entry time-entry"
                          : "track-entry"
                      }
                      onClick={(event) => event.stopPropagation()}
                    >
                      <label>
                        <span>{isTimeUnit(habit.unit) ? "amount" : habit.unit}</span>
                        <input
                          min="0"
                          onChange={(event) =>
                            setEntryDrafts((current) => ({
                              ...current,
                              [habit.id]: event.target.value,
                            }))
                          }
                          placeholder={String(habit.targetAmount)}
                          step="0.25"
                          type="number"
                          value={entryDrafts[habit.id] ?? ""}
                        />
                      </label>
                      {isTimeUnit(habit.unit) ? (
                        <label>
                          <span>unit</span>
                          <select
                        onChange={(event) =>
                          setEntryUnitDrafts((current) => ({
                            ...current,
                            [habit.id]: event.target.value as TimeEntryUnit,
                          }))
                        }
                        value={
                          entryUnitDrafts[habit.id] ??
                          defaultTimeEntryUnit(habit.unit)
                        }
                      >
                        <option value="hours">hours</option>
                        <option value="minutes">minutes</option>
                      </select>
                    </label>
                      ) : null}
                      <button
                        disabled={isSaving}
                        onClick={() => trackHabit(habit)}
                        type="button"
                      >
                        Add
                      </button>
                      {visibleNoteInputs[habit.id] ? (
                        <label className="entry-note-field">
                          <span>extra info</span>
                          <textarea
                            onChange={(event) =>
                              setEntryNoteDrafts((current) => ({
                                ...current,
                                [habit.id]: event.target.value,
                              }))
                            }
                            placeholder="Company, book, route, context..."
                            rows={2}
                            value={entryNoteDrafts[habit.id] ?? ""}
                          />
                        </label>
                      ) : null}
                      <button
                        aria-expanded={Boolean(visibleNoteInputs[habit.id])}
                        aria-label={
                          visibleNoteInputs[habit.id]
                            ? "Hide extra entry info"
                            : "Add extra entry info"
                        }
                        className="drawer-toggle"
                        onClick={() =>
                          setVisibleNoteInputs((current) => ({
                            ...current,
                            [habit.id]: !current[habit.id],
                          }))
                        }
                        type="button"
                      >
                        {visibleNoteInputs[habit.id] ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>
                  </article>
                );
              })()
            ))}
          </section>

          <section className="panel entry-list">
            <div className="list-header">
              <h2>Recent entries</h2>
            </div>
            {visibleEntries.length === 0 ? (
              <p className="status-message">
                Entries you add will appear here so you can undo mistakes.
              </p>
            ) : null}
            {visibleEntries.slice(0, 8).map((entry) => {
              const habit = habits.find((candidate) => candidate.id === entry.habitId);

              return (
                <article className="entry-item" key={entry.id}>
                  <div>
                    <h3>{habit?.name ?? "Habit"}</h3>
                    <p>
                      {habit
                        ? formatTimeAmount(entry.amount, habit.unit)
                        : `${entry.amount} units`}{" "}
                      on {entry.date}
                    </p>
                    {entry.note ? <p className="entry-note">{entry.note}</p> : null}
                  </div>
                  <button
                    disabled={isSaving}
                    onClick={() => undoEntry(entry.id)}
                    title="Undo entry"
                    type="button"
                  >
                    <RotateCcw size={16} />
                    Undo
                  </button>
                </article>
              );
            })}
          </section>
        </aside>
        </div>
      </main>
      {isHabitModalOpen ? (
        <div
          className="modal-backdrop"
          onClick={() => setIsHabitModalOpen(false)}
          role="presentation"
        >
          <section
            aria-modal="true"
            className="habit-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="Close new habit form"
              className="modal-close-button"
              onClick={() => setIsHabitModalOpen(false)}
              type="button"
            >
              <X size={18} />
            </button>
            <HabitForm onCreate={createHabit} />
          </section>
        </div>
      ) : null}
      {selectedDateKey ? (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedDateKey(null)}
          role="presentation"
        >
          <section
            aria-modal="true"
            className="day-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Daily progress</p>
                <h2>{selectedDateKey}</h2>
              </div>
              <button onClick={() => setSelectedDateKey(null)} type="button">
                Close
              </button>
            </div>

            <div className="day-progress-list">
              {habits.map((habit) => {
                const amount = getHabitAmountForDate(habit.id, selectedDateKey);
                const percent = Math.min(
                  Math.round((amount / habit.targetAmount) * 100),
                  100,
                );
                const dayEntries = selectedDateEntries.filter(
                  (entry) => entry.habitId === habit.id,
                );

                return (
                  <article className="day-progress-item" key={habit.id}>
                    <HabitIcon color={habit.color} icon={habit.icon} />
                    <div>
                      <h3>{habit.name}</h3>
                      <p>
                        {formatHabitAmount(amount, habit)} of{" "}
                        {formatHabitAmount(habit.targetAmount, habit)}
                      </p>
                      <div className="habit-progress">
                        <span style={{ width: `${percent}%` }} />
                      </div>
                      {dayEntries.length > 0 ? (
                        <>
                          <p className="entry-count">
                            {dayEntries.length} entr
                            {dayEntries.length === 1 ? "y" : "ies"}
                          </p>
                          {dayEntries.some((entry) => entry.note) ? (
                            <div className="day-notes">
                              {dayEntries
                                .filter((entry) => entry.note)
                                .map((entry) => (
                                  <p key={entry.id}>{entry.note}</p>
                                ))}
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                    <strong>{percent}%</strong>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
