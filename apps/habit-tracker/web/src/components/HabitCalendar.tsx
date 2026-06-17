import { getMonthDays, toDateKey } from "../lib/date";
import { Habit, HabitEntry } from "../types/habit";

type HabitCalendarProps = {
  entries: HabitEntry[];
  habits: Habit[];
  month: Date;
  selectedHabitId?: string;
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HabitCalendar({
  entries,
  habits,
  month,
  selectedHabitId,
}: HabitCalendarProps) {
  const days = getMonthDays(month);
  const leadingEmptyDays = days[0]?.getDay() ?? 0;
  const visibleHabits = selectedHabitId
    ? habits.filter((habit) => habit.id === selectedHabitId)
    : habits;

  const getDayCompletion = (date: Date) => {
    const dayKey = toDateKey(date);
    const dayEntries = entries.filter(
      (entry) =>
        entry.date === dayKey &&
        visibleHabits.some((habit) => habit.id === entry.habitId),
    );

    if (visibleHabits.length === 0) {
      return 0;
    }

    const completion = visibleHabits.reduce((total, habit) => {
      const entryAmount = dayEntries
        .filter((entry) => entry.habitId === habit.id)
        .reduce((sum, entry) => sum + entry.amount, 0);

      return total + Math.min(entryAmount / habit.targetAmount, 1);
    }, 0);

    return Math.round((completion / visibleHabits.length) * 100);
  };

  return (
    <div className="calendar-grid">
      {weekDays.map((day) => (
        <div className="calendar-weekday" key={day}>
          {day}
        </div>
      ))}
      {Array.from({ length: leadingEmptyDays }).map((_, index) => (
        <div
          aria-hidden="true"
          className="calendar-day calendar-day-empty"
          key={`empty-${index}`}
        />
      ))}
      {days.map((date) => {
        const completion = getDayCompletion(date);

        return (
          <div className="calendar-day" key={date.toISOString()}>
            <span>{date.getDate()}</span>
            <div
              aria-label={`${completion}% complete`}
              className="completion-ring"
              style={{
                background: `conic-gradient(#0f172a ${completion}%, #e2e8f0 0)`,
              }}
            >
              <span>{completion}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
