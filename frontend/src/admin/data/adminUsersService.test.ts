import type { ManagedUser } from '@shared/admin';
import type { ApiFetch } from '../../core/data/api';
import { createAdminUsersService } from './adminUsersService';

const ana: ManagedUser = {
  id: 'usuario-ana',
  name: 'Ana Rojas',
  email: 'ana.rojas@ucb.edu.bo',
  role: 'COMMUNITY',
};

function createResponse(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('Consultar los usuarios', () => {
  it('trae la lista de usuarios del backend', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(200, [ana]));

    await expect(createAdminUsersService(apiFetch as ApiFetch).listUsers()).resolves.toEqual([ana]);
    expect(apiFetch).toHaveBeenCalledWith('/admin/users');
  });

  it('avisa con un mensaje claro si no se pudo cargar', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(503, { error: 'Detalle' }));

    await expect(createAdminUsersService(apiFetch as ApiFetch).listUsers()).rejects.toThrow(
      'No se pudieron cargar los usuarios. Intenta nuevamente.',
    );
  });
});
