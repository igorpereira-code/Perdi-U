import type { DateRange, UsageStatistics } from '@shared/statistics';

/** Where the Administrator reads how Perdi-U is being used. Tests use a fake one. */
export type StatisticsRepository = {
  /** Without a range, it counts everything. */
  countUsage: (range?: DateRange) => Promise<UsageStatistics>;
};
