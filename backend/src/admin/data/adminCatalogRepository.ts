import type { CatalogChanges, ManagedCatalogs, ManagedCategory } from '@shared/admin';

/** Where the Administrator reads and changes categories and places. Tests use a fake one. */
export type AdminCatalogRepository = {
  /** All categories and places (with their classrooms), active and inactive, ordered by name. */
  listCatalogs: () => Promise<ManagedCatalogs>;
  /** Saves a new, active category. */
  createCategory: (name: string) => Promise<ManagedCategory>;
  /** Saves the new name and/or active state of an existing category. */
  updateCategory: (categoryId: number, changes: CatalogChanges) => Promise<ManagedCategory>;
};
