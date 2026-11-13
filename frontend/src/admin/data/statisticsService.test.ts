import type { ApiFetch } from '../../core/data/api';
import { createStatisticsService } from './statisticsService';

function createResponse(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('Consultar las estadísticas', () => {
  it('trae las cantidades del backend', async () => {
    const usage = { foundItems: 12, lostReports: 9, deliveredItems: 4, unclaimedItems: 3 };
    const apiFetch = jest.fn().mockResolvedValue(createResponse(200, usage));

    await expect(createStatisticsService(apiFetch as ApiFetch).getStatistics()).resolves.toEqual(
      usage,
    );
    expect(apiFetch).toHaveBeenCalledWith('/admin/statistics');
  });

  it('avisa con un mensaje claro si no se pudieron cargar', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(503, null));

    await expect(createStatisticsService(apiFetch as ApiFetch).getStatistics()).rejects.toThrow(
      'No se pudieron cargar las estadísticas. Intenta nuevamente.',
    );
  });
});

describe('Consultar las estadísticas de un rango de fechas', () => {
  it('envía la fecha de inicio y la de fin', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(200, {}));

    await createStatisticsService(apiFetch as ApiFetch).getStatistics({
      from: '2026-11-01',
      to: '2026-11-30',
    });

    expect(apiFetch).toHaveBeenCalledWith('/admin/statistics?from=2026-11-01&to=2026-11-30');
  });
});
