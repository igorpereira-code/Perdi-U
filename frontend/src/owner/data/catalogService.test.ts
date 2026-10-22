import type { ApiFetch } from '../../core/data/api';
import { createCatalogService, type CatalogItem } from './catalogService';

const backpack: CatalogItem = {
  code: 'HZ-0007',
  description: 'Mochila negra con llavero',
  category: 'Mochilas y bolsos',
  place: 'Bloque A – Aula A-12',
  placeReference: null,
  foundAt: '2026-10-18T12:15:00.000Z',
  hasPhoto: false,
};

function answer(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('Consultar los objetos publicados', () => {
  it('trae los objetos publicados del backend', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(200, [backpack]));

    await expect(createCatalogService(apiFetch as ApiFetch).list()).resolves.toEqual([backpack]);
    expect(apiFetch).toHaveBeenCalledWith('/catalog');
  });

  it('avisa con un mensaje claro si no se pudieron cargar', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(503, { error: 'Detalle' }));

    await expect(createCatalogService(apiFetch as ApiFetch).list()).rejects.toThrow(
      'No se pudieron cargar los objetos encontrados. Intenta nuevamente.',
    );
  });
});

describe('Consultar el detalle de un objeto publicado', () => {
  it('trae el objeto por su código', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(200, backpack));

    await expect(createCatalogService(apiFetch as ApiFetch).getByCode('HZ-0007')).resolves.toEqual(backpack);
    expect(apiFetch).toHaveBeenCalledWith('/catalog/HZ-0007');
  });

  it('devuelve vacío si el objeto no está publicado', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(404, { error: 'No encontramos este objeto.' }));

    await expect(createCatalogService(apiFetch as ApiFetch).getByCode('HZ-0008')).resolves.toBeNull();
  });
});