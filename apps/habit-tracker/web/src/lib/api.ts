import { CurrentUser, Habit, HabitDraft, HabitEntry } from "../types/habit";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      detail
        ? `Request failed: ${response.status} ${detail}`
        : `Request failed: ${response.status}`,
    );
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
};

export const api = {
  me: () => request<CurrentUser | null>("/api/auth/me"),
  habits: () => request<Habit[]>("/api/habits"),
  entries: (from: string, to: string) =>
    request<HabitEntry[]>(`/api/habit-entries?from=${from}&to=${to}`).then(
      (entries) =>
        entries.map((entry) => ({
          ...entry,
          date: entry.date.slice(0, 10),
        })),
    ),
  createHabit: (habit: HabitDraft) =>
    request<Habit>("/api/habits", {
      method: "POST",
      body: JSON.stringify(habit),
    }),
  trackHabit: (habitId: string, date: string, amount: number, note?: string) =>
    request<HabitEntry>("/api/habit-entries", {
      method: "POST",
      body: JSON.stringify({ habitId, date, amount, note }),
    }),
  deleteEntry: (entryId: string) =>
    request<null>(`/api/habit-entries/${entryId}`, {
      method: "DELETE",
    }),
};
