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

describe('Crear y editar lugares y aulas', () => {
  const jsonRequest = (method: string, body: object) => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  it('crea un bloque o espacio', async () => {
    const created = { id: 50, name: 'Bloque C', type: 'BLOCK', active: true, classrooms: [] };
    const apiFetch = jest.fn().mockResolvedValue(createResponse(201, created));

    await expect(
      createAdminCatalogService(apiFetch as ApiFetch).createPlace({
        name: 'Bloque C',
        type: 'BLOCK',
      }),
    ).resolves.toEqual(created);
    expect(apiFetch).toHaveBeenCalledWith(
      '/admin/places',
      jsonRequest('POST', { name: 'Bloque C', type: 'BLOCK' }),
    );
  });

  it('guarda los cambios de un lugar', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(200, {}));

    await createAdminCatalogService(apiFetch as ApiFetch).updatePlace(10, { active: false });

    expect(apiFetch).toHaveBeenCalledWith(
      '/admin/places/10',
      jsonRequest('PATCH', { active: false }),
    );
  });

  it('agrega un aula a un bloque', async () => {
    const created = { id: 500, name: 'A-103', active: true };
    const apiFetch = jest.fn().mockResolvedValue(createResponse(201, created));

    await expect(
      createAdminCatalogService(apiFetch as ApiFetch).createClassroom(10, 'A-103'),
    ).resolves.toEqual(created);
    expect(apiFetch).toHaveBeenCalledWith(
      '/admin/places/10/classrooms',
      jsonRequest('POST', { name: 'A-103' }),
    );
  });

  it('guarda los cambios de un aula', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(200, {}));

    await createAdminCatalogService(apiFetch as ApiFetch).updateClassroom(100, { name: 'A-101' });

    expect(apiFetch).toHaveBeenCalledWith(
      '/admin/classrooms/100',
      jsonRequest('PATCH', { name: 'A-101' }),
    );
  });

  it('muestra el motivo que da el backend, por ejemplo un aula en un espacio', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValue(createResponse(409, { error: 'Solo los bloques tienen aulas.' }));

    await expect(
      createAdminCatalogService(apiFetch as ApiFetch).createClassroom(11, 'Sala 1'),
    ).rejects.toThrow('Solo los bloques tienen aulas.');
  });

  it('si el backend no da un motivo, usa un mensaje claro', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(500, null));
    const service = createAdminCatalogService(apiFetch as ApiFetch);

    await expect(service.updatePlace(10, { active: false })).rejects.toThrow(
      'No se pudo guardar el lugar. Intenta nuevamente.',
    );
    await expect(service.updateClassroom(100, { active: false })).rejects.toThrow(
      'No se pudo guardar el aula. Intenta nuevamente.',
    );
  });
});
