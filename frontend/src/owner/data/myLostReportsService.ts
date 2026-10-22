import type { LostReportStatus } from '@shared/statuses';
import type { ApiFetch } from '../../core/data/api';

export type MyLostReport = {
  code: string;
  description: string;
  category: string;
  status: LostReportStatus;
  places: string[];
  placeDescription: string | null;
  dateFrom: string;
  dateTo: string;
};

export type MyLostReportsService = {
  listMine: () => Promise<MyLostReport[]>;
};

export function createMyLostReportsService(apiFetch: ApiFetch): MyLostReportsService {
  return {
    listMine: async () => {
      const response = await apiFetch('/my-lost-reports');
      if (!response.ok) {
        throw new Error('No se pudieron cargar tus reportes. Intenta nuevamente.');
      }
      return response.json();
    },
  };
}