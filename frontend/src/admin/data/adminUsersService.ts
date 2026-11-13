import type { ManagedUser } from '@shared/admin';
import type { Role } from '@shared/user';
import type { ApiFetch } from '../../core/data/api';

export type AdminUsersService = {
  listUsers: () => Promise<ManagedUser[]>;
  /** Saves the new role and returns the updated user. */
  changeRole: (userId: string, newRole: Role) => Promise<ManagedUser>;
};

export function createAdminUsersService(apiFetch: ApiFetch): AdminUsersService {
  return {
    listUsers: async () => {
      const response = await apiFetch('/admin/users');
      if (!response.ok) {
        throw new Error('No se pudieron cargar los usuarios. Intenta nuevamente.');
      }
      return response.json();
    },
    changeRole: async (userId, newRole) => {
      const response = await apiFetch(`/admin/users/${encodeURIComponent(userId)}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) {
        throw new Error('No se pudo cambiar el rol. Intenta nuevamente.');
      }
      return response.json();
    },
  };
}
