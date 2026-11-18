/** "2026-10-17" is shown as "17/10/2026". The text is split, so the time zone can never move the day. */
export function formatDay(day: string): string {
  const [year, month, date] = day.split('-');
  return `${date}/${month}/${year}`;
}
