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
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const api = {
  me: () => request<CurrentUser | null>("/api/auth/me"),
  habits: () => request<Habit[]>("/api/habits"),
  entries: (from: string, to: string) =>
    request<HabitEntry[]>(`/api/habit-entries?from=${from}&to=${to}`),
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
};
