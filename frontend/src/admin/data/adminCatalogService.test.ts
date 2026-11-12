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

describe('Crear una categoría', () => {
  it('envía el nombre y trae la categoría creada', async () => {
    const created = { id: 3, name: 'Audífonos', active: true };
    const apiFetch = jest.fn().mockResolvedValue(createResponse(201, created));

    await expect(
      createAdminCatalogService(apiFetch as ApiFetch).createCategory('Audífonos'),
    ).resolves.toEqual(created);
    expect(apiFetch).toHaveBeenCalledWith('/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Audífonos' }),
    });
  });

  it('muestra el motivo que da el backend, por ejemplo un nombre repetido', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValue(createResponse(409, { error: 'Ya existe una categoría con ese nombre.' }));

    await expect(
      createAdminCatalogService(apiFetch as ApiFetch).createCategory('Llaves'),
    ).rejects.toThrow('Ya existe una categoría con ese nombre.');
  });

  it('si el backend no da un motivo, usa un mensaje claro', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(500, null));

    await expect(
      createAdminCatalogService(apiFetch as ApiFetch).createCategory('Llaves'),
    ).rejects.toThrow('No se pudo guardar la categoría. Intenta nuevamente.');
  });
});

describe('Editar una categoría', () => {
  it('envía los cambios y trae la categoría actualizada', async () => {
    const updated = { id: 1, name: 'Llaves', active: false };
    const apiFetch = jest.fn().mockResolvedValue(createResponse(200, updated));

    await expect(
      createAdminCatalogService(apiFetch as ApiFetch).updateCategory(1, { active: false }),
    ).resolves.toEqual(updated);
    expect(apiFetch).toHaveBeenCalledWith('/admin/categories/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    });
  });

  it('muestra el motivo que da el backend si no se pudo guardar', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValue(createResponse(404, { error: 'No encontramos esta categoría.' }));

    await expect(
      createAdminCatalogService(apiFetch as ApiFetch).updateCategory(9, { name: 'Libros' }),
    ).rejects.toThrow('No encontramos esta categoría.');
  });
});
