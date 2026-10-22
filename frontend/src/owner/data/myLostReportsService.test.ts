import type { ApiFetch } from '../../core/data/api';
import { createMyLostReportsService, type MyLostReport } from './myLostReportsService';

const keys: MyLostReport = {
  code: 'PR-0007',
  description: 'Llaves con llavero azul',
  category: 'Llaves',
  status: 'HAS_MATCHES',
  places: ['Biblioteca'],
  placeDescription: null,
  dateFrom: '2026-10-17',
  dateTo: '2026-10-18',
};

function answer(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('Consultar mis reportes de pérdida', () => {
  it('trae mis reportes del backend', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(200, [keys]));

    await expect(createMyLostReportsService(apiFetch as ApiFetch).listMine()).resolves.toEqual([keys]);
    expect(apiFetch).toHaveBeenCalledWith('/my-lost-reports');
  });

  it('avisa con un mensaje claro si no se pudieron cargar', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(503, { error: 'Detalle' }));

    await expect(createMyLostReportsService(apiFetch as ApiFetch).listMine()).rejects.toThrow(
      'No se pudieron cargar tus reportes. Intenta nuevamente.',
    );
  });
});