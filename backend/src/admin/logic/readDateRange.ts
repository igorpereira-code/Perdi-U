import type { DateRange } from '@shared/statistics';

export type DateRangeResult = { range?: DateRange } | { error: string };

const DAY_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real day written as "YYYY-MM-DD" (not "2026-02-30"). */
function isDay(value: string): boolean {
  if (!DAY_FORMAT.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Reads "?from=…&to=…". Without dates, the statistics count everything. */
export function readDateRange(query: unknown): DateRangeResult {
  const { from, to } = (query ?? {}) as { from?: unknown; to?: unknown };
  if (from === undefined && to === undefined) {
    return {};
  }
  if (typeof from !== 'string' || typeof to !== 'string') {
    return { error: 'Elige la fecha de inicio y la de fin.' };
  }
  if (!isDay(from) || !isDay(to)) {
    return { error: 'La fecha no es válida.' };
  }
  if (from > to) {
    return { error: 'La fecha de inicio no puede ser posterior a la de fin.' };
  }
  return { range: { from, to } };
}
