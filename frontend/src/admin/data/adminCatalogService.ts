import type { ManagedCatalogs } from '@shared/admin';
import type { ApiFetch } from '../../core/data/api';

export type AdminCatalogService = {
  /** All categories and places, active and inactive. */
  listCatalogs: () => Promise<ManagedCatalogs>;
};

export function createAdminCatalogService(apiFetch: ApiFetch): AdminCatalogService {
  return {
    listCatalogs: async () => {
      const response = await apiFetch('/admin/catalogs');
      if (!response.ok) {
        throw new Error('No se pudieron cargar las categorías y lugares. Intenta nuevamente.');
      }
      return response.json();
    },
  };
}
