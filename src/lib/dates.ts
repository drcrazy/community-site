export function formatNewsDate(value: Date | string, locale = "en") {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function toDateTimeAttribute(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}
