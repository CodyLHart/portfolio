const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

const toDate = (value: string | null) => {
  if (!value) {
    return null;
  }

  const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00`
    : value;
  const date = new Date(normalizedDate);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateTime = (value: string) => {
  const date = toDate(value);

  return date ? dateTimeFormatter.format(date) : "";
};

export const formatDate = (value: string | null) => {
  const date = toDate(value);

  return date ? dateFormatter.format(date) : "";
};
