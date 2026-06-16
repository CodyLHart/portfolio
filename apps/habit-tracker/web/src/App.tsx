import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LogIn, UserCircle } from "lucide-react";
import { HabitCalendar } from "./components/HabitCalendar";
import { HabitForm } from "./components/HabitForm";
import { HabitIcon } from "./components/HabitIcon";
import { formatMonth, toDateKey } from "./lib/date";
import { Habit, HabitDraft, HabitEntry } from "./types/habit";
import "./styles.css";

const today = toDateKey(new Date());

const seedHabits: Habit[] = [
  {
    id: "read",
    name: "Read",
    icon: "book",
    targetAmount: 50,
    unit: "pages",
    frequency: "weekly",
    color: "#2563eb",
    createdAt: today,
  },
  {
    id: "water",
    name: "Hydrate",
    icon: "glassWater",
    targetAmount: 8,
    unit: "glasses",
    frequency: "daily",
    color: "#0891b2",
    createdAt: today,
  },
];

const seedEntries: HabitEntry[] = [
  { id: "1", habitId: "read", date: today, amount: 20 },
  { id: "2", habitId: "water", date: today, amount: 5 },
];

export default function App() {
  const [habits, setHabits] = useState(seedHabits);
  const [entries, setEntries] = useState(seedEntries);
  const [selectedHabitId, setSelectedHabitId] = useState<string | undefined>();
  const [month, setMonth] = useState(new Date());

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

  const createHabit = (draft: HabitDraft) => {
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: draft.name,
      icon: draft.icon ?? "target",
      targetAmount: draft.targetAmount,
      unit: draft.unit,
      frequency: draft.frequency,
      color: draft.color,
      createdAt: new Date().toISOString(),
    };

    setHabits((current) => [habit, ...current]);
    setSelectedHabitId(habit.id);
  };

  const trackHabit = (habit: Habit, amount: number) => {
    setEntries((current) => [
      {
        id: crypto.randomUUID(),
        habitId: habit.id,
        date: today,
        amount,
      },
      ...current,
    ]);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Habit Tracker</p>
          <h1>Track the shape of your weeks.</h1>
        </div>
        <nav className="user-nav" aria-label="User">
          <a className="google-button" href="/api/auth/login/google">
            <LogIn size={18} />
            Google sign-in
          </a>
          <button className="avatar-button" type="button" title="User profile">
            <UserCircle size={24} />
          </button>
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
                  setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
                }
                type="button"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() =>
                  setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
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
          <HabitForm onCreate={createHabit} />

          <section className="panel habit-list">
            <div className="list-header">
              <h2>Habits</h2>
              <button onClick={() => setSelectedHabitId(undefined)} type="button">
                All
              </button>
            </div>
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
