import type { ApiFetch } from '../../core/data/api';
import { createLostReportsService, type LostReportPayload } from './lostReportsService';

const report: LostReportPayload = {
  description: 'Llaves con llavero azul',
  categoryId: 47,
  places: [{ placeId: 83, classroomId: null }],
  placeDescription: null,
  dateFrom: '2026-10-17',
  dateTo: '2026-10-18',
};

function answer(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('Enviar el reporte de pérdida', () => {
  it('envía el reporte al backend y devuelve su código', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(201, { code: 'PR-0007', status: 'SEARCHING' }));

    const created = await createLostReportsService(apiFetch as ApiFetch).create(report, null);

    expect(created).toEqual({ code: 'PR-0007' });
    expect(apiFetch).toHaveBeenCalledWith('/lost-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
  });

  it('muestra el mensaje del backend cuando rechaza el reporte', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(400, { error: 'Revisa los datos del reporte.' }));

    await expect(createLostReportsService(apiFetch as ApiFetch).create(report, null)).rejects.toThrow(
      'Revisa los datos del reporte.',
    );
  });

  it('avisa con un mensaje claro si no hay conexión', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(createLostReportsService(apiFetch as ApiFetch).create(report, null)).rejects.toThrow(
      'No se pudo enviar tu reporte. Intenta nuevamente.',
    );
  });
});