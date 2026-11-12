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
};
