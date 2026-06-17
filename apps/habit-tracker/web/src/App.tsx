import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LogIn, UserCircle } from "lucide-react";
import { HabitCalendar } from "./components/HabitCalendar";
import { HabitForm } from "./components/HabitForm";
import { HabitIcon } from "./components/HabitIcon";
import { endOfMonth, formatMonth, startOfMonth, toDateKey } from "./lib/date";
import { api } from "./lib/api";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const createHabit = async (draft: HabitDraft) => {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const habit = await api.createHabit(draft);
      setHabits((current) => [habit, ...current]);
      setSelectedHabitId(habit.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create habit.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const trackHabit = async (habit: Habit, amount: number) => {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const entry = await api.trackHabit(habit.id, today, amount);
      setEntries((current) => [{ ...entry, date: entry.date.slice(0, 10) }, ...current]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to track habit.",
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
      <header className="app-header">
        <div>
          <p className="eyebrow">Habit Tracker</p>
          <h1>Track the shape of your weeks.</h1>
        </div>
        <nav className="user-nav" aria-label="Navigation">
          <a className="portfolio-link" href={portfolioUrl}>
            Portfolio
          </a>
          {currentUser ? (
            <>
              <span className="user-name">{currentUser.displayName}</span>
              <button className="avatar-button" type="button" title="User profile">
                {currentUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" src={currentUser.avatarUrl} />
                ) : (
                  <UserCircle size={24} />
                )}
              </button>
            </>
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

      <main className="dashboard">
        <section className="panel hero-panel">
          <div>
            <p className="eyebrow">Today</p>
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

          <HabitForm onCreate={createHabit} />

          <section className="panel habit-list">
            <div className="list-header">
              <h2>Habits</h2>
              <button onClick={() => setSelectedHabitId(undefined)} type="button">
                All
              </button>
            </div>
            {isLoading ? <p className="status-message">Loading habits...</p> : null}
            {!isLoading && currentUser && habits.length === 0 ? (
              <p className="status-message">
                No habits yet. Create one above to start tracking.
              </p>
            ) : null}
            {habits.map((habit) => (
              <article
                className={selectedHabitId === habit.id ? "habit active" : "habit"}
                key={habit.id}
                onClick={() => setSelectedHabitId(habit.id)}
              >
                <HabitIcon color={habit.color} icon={habit.icon} />
                <div>
                  <h3>{habit.name}</h3>
                  <p>
                    {habit.targetAmount} {habit.unit}/{habit.frequency}
                  </p>
                </div>
                <button
                  disabled={isSaving}
                  onClick={(event) => {
                    event.stopPropagation();
                    trackHabit(habit, habit.targetAmount);
                  }}
                  type="button"
                >
                  Done
                </button>
              </article>
            ))}
          </section>
        </aside>
      </main>
    </div>
  );
}
