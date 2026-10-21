import type { ApiFetch } from '../../core/data/api';

export type LostReportPayload = {
  description: string;
  categoryId: number;
  places: { placeId: number; classroomId: number | null }[];
  placeDescription: string | null;
  dateFrom: string;
  dateTo: string;
};

export type LostReportCreated = { code: string };

export type LostReportsService = {
  create: (report: LostReportPayload, photo: File | null) => Promise<LostReportCreated>;
};

const SEND_ERROR = 'No se pudo enviar tu reporte. Intenta nuevamente.';

export function createLostReportsService(apiFetch: ApiFetch): LostReportsService {
  return {
    create: async (report, photo) => {
      let init: RequestInit;
      if (photo) {
        const form = new FormData();
        form.append('report', JSON.stringify(report));
        form.append('photo', photo);
        init = { method: 'POST', body: form };
      } else {
        init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) };
      }

      let response: Response;
      try {
        response = await apiFetch('/lost-reports', init);
      } catch {
        throw new Error(SEND_ERROR);
      }
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof body?.error === 'string' ? body.error : SEND_ERROR);
      }
      if (typeof body?.code !== 'string' || !/^PR-\d+$/.test(body.code)) {
        throw new Error(SEND_ERROR);
      }
      return { code: body.code };
    },
  };
}