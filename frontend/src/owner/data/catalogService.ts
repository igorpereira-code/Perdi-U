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
  };
}