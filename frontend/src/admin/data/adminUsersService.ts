import type { ManagedUser } from '@shared/admin';
import type { ApiFetch } from '../../core/data/api';

export type AdminUsersService = {
  listUsers: () => Promise<ManagedUser[]>;
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
  };
}
