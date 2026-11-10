const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
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

  if (elapsed < MINUTE) {
    return 'Hace un momento';
  }
  if (elapsed < HOUR) {
    return `Hace ${Math.floor(elapsed / MINUTE)} min`;
  }
  if (dayKey.format(date) === dayKey.format(now)) {
    return `Hace ${Math.floor(elapsed / HOUR)} h`;
  }
  if (dayKey.format(date) === dayKey.format(new Date(now.getTime() - DAY))) {
    return 'Ayer';
  }
  return dateFormat.format(date);
}
