export type HabitFrequency = "daily" | "weekly" | "monthly";

export type Habit = {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  unit: string;
  frequency: HabitFrequency;
  color: string;
  createdAt: string;
};

export type HabitEntry = {
  id: string;
  habitId: string;
  date: string;
  amount: number;
  note?: string;
};

export type HabitDraft = {
  name: string;
  targetAmount: number;
  unit: string;
  frequency: HabitFrequency;
  icon?: string;
  color: string;
};

export type CurrentUser = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
};
