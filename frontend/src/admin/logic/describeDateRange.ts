import type { DateRange } from '@shared/statistics';

const MONTHS = [
  'ene.',
  'feb.',
  'mar.',
  'abr.',
  'may.',
  'jun.',
  'jul.',
  'ago.',
  'sep.',
  'oct.',
  'nov.',
  'dic.',
];

/** "2026-11-01" → "1 nov. 2026". */
function formatDay(day: string): string {
  const [year, month, dayOfMonth] = day.split('-').map(Number);
  return `${dayOfMonth} ${MONTHS[month - 1]} ${year}`;
}

/** Which days the statistics are counting, in words. */
export function describeDateRange(range?: DateRange): string {
  if (!range) {
    return 'Desde que empezó Perdi-U';
  }
  if (range.from === range.to) {
    return `El ${formatDay(range.from)}`;
  }
  return `Del ${formatDay(range.from)} al ${formatDay(range.to)}`;
}
