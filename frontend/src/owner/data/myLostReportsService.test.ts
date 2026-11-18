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

describe('Consultar el detalle de mi reporte', () => {
  it('trae mi reporte por su código', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(200, keys));

    await expect(createMyLostReportsService(apiFetch as ApiFetch).getMine('PR-0007')).resolves.toEqual(keys);
    expect(apiFetch).toHaveBeenCalledWith('/my-lost-reports/PR-0007');
  });

  it('devuelve vacío si el reporte no existe o no es mío', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(404, { error: 'No encontramos este reporte.' }));

    await expect(createMyLostReportsService(apiFetch as ApiFetch).getMine('PR-0001')).resolves.toBeNull();
  });
});

describe('Editar mi reporte de pérdida', () => {
  const editable = {
    description: 'Llaves con llavero azul',
    categoryId: 47,
    places: [{ placeId: 98, classroomId: null }],
    placeDescription: null,
    dateFrom: '2026-10-17',
    dateTo: '2026-10-18',
  };

  it('trae los datos del reporte para editarlo', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(200, editable));

    await expect(
      createMyLostReportsService(apiFetch as ApiFetch).getEditable('PR-0007'),
    ).resolves.toEqual(editable);
    expect(apiFetch).toHaveBeenCalledWith('/my-lost-reports/PR-0007/edit');
  });

  it('guarda los cambios del reporte', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(200, { updated: true }));

    await createMyLostReportsService(apiFetch as ApiFetch).update('PR-0007', editable);

    expect(apiFetch).toHaveBeenCalledWith('/my-lost-reports/PR-0007', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editable),
    });
  });

  it('avisa con un mensaje claro si no se pudieron guardar los cambios', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(503, { error: 'Detalle' }));

    await expect(
      createMyLostReportsService(apiFetch as ApiFetch).update('PR-0007', editable),
    ).rejects.toThrow('No se pudieron guardar los cambios. Intenta nuevamente.');
  });
});

describe('Cerrar mi reporte de pérdida', () => {
  it('pide cerrar el reporte', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(200, { closed: true }));

    await createMyLostReportsService(apiFetch as ApiFetch).close('PR-0007');

    expect(apiFetch).toHaveBeenCalledWith('/my-lost-reports/PR-0007/close', { method: 'POST' });
  });

  it('avisa si el reporte ya fue cerrado o recuperado', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(409, { error: 'Detalle' }));

    await expect(createMyLostReportsService(apiFetch as ApiFetch).close('PR-0007')).rejects.toThrow(
      'Este reporte ya fue cerrado o recuperado.',
    );
  });

  it('avisa con un mensaje claro si no se pudo cerrar', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(503, { error: 'Detalle' }));

    await expect(createMyLostReportsService(apiFetch as ApiFetch).close('PR-0007')).rejects.toThrow(
      'No se pudo cerrar el reporte. Intenta nuevamente.',
    );
  });
});
