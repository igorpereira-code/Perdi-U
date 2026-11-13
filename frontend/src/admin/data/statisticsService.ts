import type { UsageStatistics } from '@shared/statistics';
import type { ApiFetch } from '../../core/data/api';

export type StatisticsService = {
  getStatistics: () => Promise<UsageStatistics>;
};

export function createStatisticsService(apiFetch: ApiFetch): StatisticsService {
  return {
    getStatistics: async () => {
      const response = await apiFetch('/admin/statistics');
      if (!response.ok) {
        throw new Error('No se pudieron cargar las estadísticas. Intenta nuevamente.');
      }
      return response.json();
    },
  };
}
