import type { ApiFetch } from '../../core/data/api';

export type CatalogItem = {
  code: string;
  description: string;
  category: string;
  place: string;
  placeReference: string | null;
  foundAt: string;
  hasPhoto: boolean;
};

export type CatalogService = {
  list: () => Promise<CatalogItem[]>;
  getByCode: (code: string) => Promise<CatalogItem | null>;
};

export function createCatalogService(apiFetch: ApiFetch): CatalogService {
  return {
    list: async () => {
      const response = await apiFetch('/catalog');
      if (!response.ok) {
        throw new Error('No se pudieron cargar los objetos encontrados. Intenta nuevamente.');
      }
      return response.json();
    },
    getByCode: async (code) => {
      const response = await apiFetch(`/catalog/${encodeURIComponent(code)}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error('No se pudo cargar el objeto. Intenta nuevamente.');
      }
      return response.json();
    },
  };
}