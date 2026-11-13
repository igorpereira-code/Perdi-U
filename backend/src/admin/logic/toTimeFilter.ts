import type { DateRange } from '@shared/statistics';

/** Bolivia is always at UTC-04:00 (no daylight saving time). */
const CAMPUS_UTC_OFFSET = '-04:00';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type TimeFilter = { gte: Date; lt: Date };

/** From the start of the first day to the end of the last one, in Bolivian time. */
export function toTimeFilter({ from, to }: DateRange): TimeFilter {
  const startOfFirstDay = new Date(`${from}T00:00:00${CAMPUS_UTC_OFFSET}`);
  const startOfLastDay = new Date(`${to}T00:00:00${CAMPUS_UTC_OFFSET}`);
  return { gte: startOfFirstDay, lt: new Date(startOfLastDay.getTime() + ONE_DAY_MS) };
}
