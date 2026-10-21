import type { ApiFetch } from '../../core/data/api';
import type { LostReportSubmitData } from '../presenter/NewLostReportPage';
import type { LostReportSummary } from '../presenter/MyLostReportsPage';

export type OwnerService = {
  createLostReport: (data: LostReportSubmitData) => Promise<{ code: string }>;
  getMyLostReports: () => Promise<LostReportSummary[]>;
};

export function createOwnerService(apiFetch: ApiFetch): OwnerService {
  return {
    createLostReport: async (data) => {
      // Enviamos la petición como JSON estándar
      const payload = {
        description: data.description,
        categoryId: data.category,
        dateFrom: data.dateFrom,
        dateTo: data.dateTo,
        placeDescription: data.placeDescription,
        // La foto está omitida intencionalmente hasta configurar Supabase Storage
      };

      const response = await apiFetch('/api/lost-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Error al guardar el reporte en la base de datos');
      return response.json();
    },

    getMyLostReports: async () => {
      const response = await apiFetch('/api/lost-reports/me');
      if (!response.ok) throw new Error('Error al obtener tus reportes');
      return response.json();
    },
  };
}