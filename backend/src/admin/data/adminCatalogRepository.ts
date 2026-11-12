import type {
  CatalogChanges,
  ManagedCatalogs,
  ManagedCategory,
  ManagedClassroom,
  ManagedPlace,
  NewPlace,
} from '@shared/admin';

/** Where the Administrator reads and changes categories and places. Tests use a fake one. */
export type AdminCatalogRepository = {
  /** All categories and places (with their classrooms), active and inactive, ordered by name. */
  listCatalogs: () => Promise<ManagedCatalogs>;
  /** Saves a new, active category. */
  createCategory: (name: string) => Promise<ManagedCategory>;
  /** Saves the new name and/or active state of an existing category. */
  updateCategory: (categoryId: number, changes: CatalogChanges) => Promise<ManagedCategory>;
  /** Saves a new, active block or space, still without classrooms. */
  createPlace: (newPlace: NewPlace) => Promise<ManagedPlace>;
  /** Saves the new name and/or active state of an existing place. */
  updatePlace: (placeId: number, changes: CatalogChanges) => Promise<ManagedPlace>;
  /** Saves a new, active classroom inside a block. */
  createClassroom: (placeId: number, name: string) => Promise<ManagedClassroom>;
  /** Saves the new name and/or active state of an existing classroom. */
  updateClassroom: (classroomId: number, changes: CatalogChanges) => Promise<ManagedClassroom>;
};
