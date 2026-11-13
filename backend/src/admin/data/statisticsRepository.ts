import type { UsageStatistics } from '@shared/statistics';

/** Where the Administrator reads how Perdi-U is being used. Tests use a fake one. */
export type StatisticsRepository = {
  countUsage: () => Promise<UsageStatistics>;
};
