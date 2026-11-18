import type { ManagedCatalogs } from '@shared/admin';
import type { AdminCatalogRepository } from './adminCatalogRepository';

/** Ids that new items get in the fake, so tests can expect them. */
const NEW_CATEGORY_ID = 99;
const NEW_PLACE_ID = 50;
const NEW_CLASSROOM_ID = 500;

function findById<T extends { id: number }>(items: T[], id: number): T {
  const item = items.find((saved) => saved.id === id);
  if (!item) {
    throw new Error(`Unknown id ${id}`);
  }
  return item;
}

/** In-memory categories and places for tests. It never touches the shared database. */
export function fakeAdminCatalogRepository(initial: ManagedCatalogs): AdminCatalogRepository {
  // A copy, so one test does not change the catalogs of the next one.
  const catalogs: ManagedCatalogs = structuredClone(initial);
  const allClassrooms = () => catalogs.places.flatMap((place) => place.classrooms);

  return {
    listCatalogs: async () => catalogs,
    createCategory: async (name) => {
      const newCategory = { id: NEW_CATEGORY_ID, name, active: true };
      catalogs.categories.push(newCategory);
      return newCategory;
    },
    updateCategory: async (categoryId, changes) =>
      Object.assign(findById(catalogs.categories, categoryId), changes),
    createPlace: async ({ name, type }) => {
      const newPlace = { id: NEW_PLACE_ID, name, type, active: true, classrooms: [] };
      catalogs.places.push(newPlace);
      return newPlace;
    },
    updatePlace: async (placeId, changes) =>
      Object.assign(findById(catalogs.places, placeId), changes),
    createClassroom: async (placeId, name) => {
      const newClassroom = { id: NEW_CLASSROOM_ID, name, active: true };
      findById(catalogs.places, placeId).classrooms.push(newClassroom);
      return newClassroom;
    },
    updateClassroom: async (classroomId, changes) =>
      Object.assign(findById(allClassrooms(), classroomId), changes),
  };
}
