import type { ManagedCatalogs } from '@shared/admin';
import type { ApiFetch } from '../../core/data/api';
import { createAdminCatalogService } from './adminCatalogService';

const catalogs: ManagedCatalogs = {
  categories: [{ id: 1, name: 'Llaves', active: true }],
  places: [{ id: 11, name: 'Biblioteca', type: 'SPACE', active: false, classrooms: [] }],
};

function createResponse(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('Consultar las categorías y lugares', () => {
  it('trae las categorías y los lugares del backend', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(200, catalogs));

    await expect(createAdminCatalogService(apiFetch as ApiFetch).listCatalogs()).resolves.toEqual(
      catalogs,
    );
    expect(apiFetch).toHaveBeenCalledWith('/admin/catalogs');
  });

  it('avisa con un mensaje claro si no se pudieron cargar', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(503, { error: 'Detalle' }));

    await expect(createAdminCatalogService(apiFetch as ApiFetch).listCatalogs()).rejects.toThrow(
      'No se pudieron cargar las categorías y lugares. Intenta nuevamente.',
    );
  });
});
