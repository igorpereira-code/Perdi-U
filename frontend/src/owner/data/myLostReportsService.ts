import type { LostReportStatus } from '@shared/statuses';
import type { ApiFetch } from '../../core/data/api';
import type { LostReportPayload } from './lostReportsService';

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
  /** The report as the edit form fills it. */
  getEditable: (code: string) => Promise<LostReportPayload>;
  update: (code: string, changes: LostReportPayload) => Promise<void>;
  /** "Ya lo encontré": closes the report. */
  close: (code: string) => Promise<void>;
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
    getEditable: async (code) => {
      const response = await apiFetch(`/my-lost-reports/${encodeURIComponent(code)}/edit`);
      if (!response.ok) {
        throw new Error('No se pudo cargar el reporte para editar. Intenta nuevamente.');
      }
      return response.json();
    },
    update: async (code, changes) => {
      const response = await apiFetch(`/my-lost-reports/${encodeURIComponent(code)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      if (!response.ok) {
        throw new Error('No se pudieron guardar los cambios. Intenta nuevamente.');
      }
    },
    close: async (code) => {
      const response = await apiFetch(`/my-lost-reports/${encodeURIComponent(code)}/close`, { method: 'POST' });
      if (response.status === 409) {
        throw new Error('Este reporte ya fue cerrado o recuperado.');
      }
      if (!response.ok) {
        throw new Error('No se pudo cerrar el reporte. Intenta nuevamente.');
      }
    },
  };
}