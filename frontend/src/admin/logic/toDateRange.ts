import type { DateRange } from '@shared/statistics';

/** The range to ask the backend for. Without dates (undefined), it counts everything. */
export function toDateRange(from: string, to: string): DateRange | undefined {
  return from === '' && to === '' ? undefined : { from, to };
}
