const hourUnits = new Set(["hour", "hours", "hr", "hrs"]);
const minuteUnits = new Set(["minute", "minutes", "min", "mins"]);

export type TimeEntryUnit = "hours" | "minutes";

export const normalizeUnit = (unit: string) => unit.trim().toLowerCase();

export const isTimeUnit = (unit: string) => {
  const normalizedUnit = normalizeUnit(unit);
  return hourUnits.has(normalizedUnit) || minuteUnits.has(normalizedUnit);
};

export const defaultTimeEntryUnit = (habitUnit: string): TimeEntryUnit =>
  minuteUnits.has(normalizeUnit(habitUnit)) ? "minutes" : "hours";

export const convertTimeAmountToHabitUnit = (
  amount: number,
  entryUnit: TimeEntryUnit,
  habitUnit: string,
) => {
  const normalizedHabitUnit = normalizeUnit(habitUnit);

  if (hourUnits.has(normalizedHabitUnit)) {
    return entryUnit === "minutes" ? amount / 60 : amount;
  }

  if (minuteUnits.has(normalizedHabitUnit)) {
    return entryUnit === "hours" ? amount * 60 : amount;
  }

  return amount;
};

export const formatTimeAmount = (amount: number, habitUnit: string) => {
  const normalizedHabitUnit = normalizeUnit(habitUnit);
  const formattedAmount = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);

  if (hourUnits.has(normalizedHabitUnit)) {
    const hours = Math.floor(amount);
    const minutes = Math.round((amount - hours) * 60);

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m`;
    }

    return `${formattedAmount}h`;
  }

  if (minuteUnits.has(normalizedHabitUnit)) {
    if (amount >= 60) {
      const hours = Math.floor(amount / 60);
      const minutes = Math.round(amount % 60);

      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    return `${formattedAmount}m`;
  }

  return `${amount} ${habitUnit}`;
};
