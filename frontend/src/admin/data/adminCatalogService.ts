import type { CatalogChanges, ManagedCatalogs, ManagedCategory } from '@shared/admin';
import type { ApiFetch } from '../../core/data/api';

export type AdminCatalogService = {
  /** All categories and places, active and inactive. */
  listCatalogs: () => Promise<ManagedCatalogs>;
  /** Saves a new category and returns it. */
  createCategory: (name: string) => Promise<ManagedCategory>;
  /** Saves the new name and/or active state and returns the updated category. */
  updateCategory: (categoryId: number, changes: CatalogChanges) => Promise<ManagedCategory>;
};

const SAVE_CATEGORY_ERROR = 'No se pudo guardar la categoría. Intenta nuevamente.';

/** The message the backend sent (for example, "Ya existe una categoría con ese nombre."). */
async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  return typeof body?.error === 'string' ? body.error : fallback;
}

/** Returns what the backend saved, or throws the backend's message. */
async function readSavedData<T>(request: Promise<Response>, fallback: string): Promise<T> {
  const savedResponse = await request;
  if (!savedResponse.ok) {
    throw new Error(await readErrorMessage(savedResponse, fallback));
  }
  return savedResponse.json();
}

export function createAdminCatalogService(apiFetch: ApiFetch): AdminCatalogService {
  function requestJson(path: string, method: 'POST' | 'PATCH', body: object) {
    return apiFetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  return {
    listCatalogs: async () => {
      const response = await apiFetch('/admin/catalogs');
      if (!response.ok) {
        throw new Error('No se pudieron cargar las categorías y lugares. Intenta nuevamente.');
      }
      return response.json();
    },
    createCategory: (name) =>
      readSavedData(requestJson('/admin/categories', 'POST', { name }), SAVE_CATEGORY_ERROR),
    updateCategory: (categoryId, changes) =>
      readSavedData(
        requestJson(`/admin/categories/${categoryId}`, 'PATCH', changes),
        SAVE_CATEGORY_ERROR,
      ),
  };
}
