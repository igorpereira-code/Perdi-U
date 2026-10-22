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
  getMine: (code: string) => Promise<MyLostReport | null>;
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
    getMine: async (code) => {
      const response = await apiFetch(`/my-lost-reports/${encodeURIComponent(code)}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error('No se pudo cargar el reporte. Intenta nuevamente.');
      }
      return response.json();
    },
  };
}