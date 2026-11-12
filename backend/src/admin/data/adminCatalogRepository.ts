import type { ManagedCatalogs } from '@shared/admin';

/** Where the Administrator reads and changes categories and places. Tests use a fake one. */
export type AdminCatalogRepository = {
  /** All categories and places (with their classrooms), active and inactive, ordered by name. */
  listCatalogs: () => Promise<ManagedCatalogs>;
};
