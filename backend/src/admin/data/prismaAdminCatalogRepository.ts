import { db } from '../../core/data/prisma';
import type { AdminCatalogRepository } from './adminCatalogRepository';

const BY_NAME = { name: 'asc' } as const;
const CATEGORY_FIELDS = { id: true, name: true, active: true } as const;
const CLASSROOM_FIELDS = { id: true, name: true, active: true } as const;
const PLACE_FIELDS = {
  id: true,
  name: true,
  type: true,
  active: true,
  classrooms: { select: CLASSROOM_FIELDS, orderBy: BY_NAME },
} as const;

export const prismaAdminCatalogRepository: AdminCatalogRepository = {
  listCatalogs: async () => {
    const [categories, places] = await Promise.all([
      db().category.findMany({ select: CATEGORY_FIELDS, orderBy: BY_NAME }),
      db().place.findMany({ select: PLACE_FIELDS, orderBy: BY_NAME }),
    ]);
    return { categories, places };
  },
  createCategory: (name) =>
    db().category.create({ data: { name, active: true }, select: CATEGORY_FIELDS }),
  updateCategory: (categoryId, changes) =>
    db().category.update({ where: { id: categoryId }, data: changes, select: CATEGORY_FIELDS }),
  createPlace: ({ name, type }) =>
    db().place.create({ data: { name, type, active: true }, select: PLACE_FIELDS }),
  updatePlace: (placeId, changes) =>
    db().place.update({ where: { id: placeId }, data: changes, select: PLACE_FIELDS }),
  createClassroom: (placeId, name) =>
    db().classroom.create({ data: { placeId, name, active: true }, select: CLASSROOM_FIELDS }),
  updateClassroom: (classroomId, changes) =>
    db().classroom.update({ where: { id: classroomId }, data: changes, select: CLASSROOM_FIELDS }),
};
