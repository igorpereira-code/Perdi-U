import type { DateRange, UsageStatistics } from '@shared/statistics';
import type { ApiFetch } from '../../core/data/api';

export type StatisticsService = {
  /** Without a range, it counts everything. */
  getStatistics: (range?: DateRange) => Promise<UsageStatistics>;
};

/** "/admin/statistics?from=2026-11-01&to=2026-11-30", or without dates if there is no range. */
function statisticsPath(range?: DateRange): string {
  return range ? `/admin/statistics?${new URLSearchParams(range)}` : '/admin/statistics';
}

export function createStatisticsService(apiFetch: ApiFetch): StatisticsService {
  return {
    getStatistics: async (range) => {
      const response = await apiFetch(statisticsPath(range));
      if (!response.ok) {
        throw new Error('No se pudieron cargar las estadísticas. Intenta nuevamente.');
      }
      return response.json();
    },
  };
}
