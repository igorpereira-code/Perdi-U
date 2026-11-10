const ONE_MINUTE_IN_MS = 60 * 1000;
const ONE_HOUR_IN_MS = 60 * ONE_MINUTE_IN_MS;
const ONE_DAY_IN_MS = 24 * ONE_HOUR_IN_MS;
const TIME_ZONE = 'America/La_Paz';

const dayKey = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: TIME_ZONE,
});
const dateFormat = new Intl.DateTimeFormat('es-BO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: TIME_ZONE,
});

/** When a notification happened, in words: "Hace 5 min", "Hace 3 h", "Ayer" or its date. */
export function formatNotificationTime(createdAt: string, now: Date = new Date()): string {
  const date = new Date(createdAt);
  const elapsed = now.getTime() - date.getTime();

  if (elapsed < ONE_MINUTE_IN_MS) {
    return 'Hace un momento';
  }
  if (elapsed < ONE_HOUR_IN_MS) {
    return `Hace ${Math.floor(elapsed / ONE_MINUTE_IN_MS)} min`;
  }
  if (dayKey.format(date) === dayKey.format(now)) {
    return `Hace ${Math.floor(elapsed / ONE_HOUR_IN_MS)} h`;
  }
  if (dayKey.format(date) === dayKey.format(new Date(now.getTime() - ONE_DAY_IN_MS))) {
    return 'Ayer';
  }
  return dateFormat.format(date);
}
