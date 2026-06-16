export const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

export const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export const endOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const getMonthDays = (month: Date) => {
  const firstDay = startOfMonth(month);
  const lastDay = endOfMonth(month);
  const days: Date[] = [];

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), day));
  }

  return days;
};

export const formatMonth = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
