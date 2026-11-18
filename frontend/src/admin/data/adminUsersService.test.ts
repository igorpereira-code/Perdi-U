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
  describe('Cambiar el rol de un usuario', () => {
    it('pide al backend el nuevo rol y trae al usuario actualizado', async () => {
      const updatedAna = { ...ana, role: 'WELFARE' };
      const apiFetch = jest.fn().mockResolvedValue(createResponse(200, updatedAna));

      await expect(
        createAdminUsersService(apiFetch as ApiFetch).changeRole('usuario-ana', 'WELFARE'),
      ).resolves.toEqual(updatedAna);
      expect(apiFetch).toHaveBeenCalledWith('/admin/users/usuario-ana/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'WELFARE' }),
      });
    });

    it('avisa con un mensaje claro si no se pudo cambiar', async () => {
      const apiFetch = jest.fn().mockResolvedValue(createResponse(503, { error: 'Detalle' }));

      await expect(
        createAdminUsersService(apiFetch as ApiFetch).changeRole('usuario-ana', 'WELFARE'),
      ).rejects.toThrow('No se pudo cambiar el rol. Intenta nuevamente.');
    });
  });
});
