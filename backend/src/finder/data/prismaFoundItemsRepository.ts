import { db } from '../../core/data/prisma';
import type { FoundItemsRepository } from './foundItemsRepository';

export const prismaFoundItemsRepository: FoundItemsRepository = {
  getCatalogs: async () => {
    const [categories, places] = await Promise.all([
      db().category.findMany({
        where: { active: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      db().place.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          type: true,
          classrooms: {
            where: { active: true },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);
    return { categories, places };
  },

  create: (item) =>
    db().foundItem.create({
      data: {
        description: item.description,
        categoryId: item.categoryId,
        placeId: item.placeId,
        classroomId: item.classroomId,
        placeReference: item.placeReference,
        foundAt: item.foundAt,
        finderId: item.finderId,
        ...(item.photoUrl !== undefined ? { photoUrl: item.photoUrl } : {}),
        status: 'PENDING_DROP_OFF',
      },
      select: { code: true, status: true },
    }),
};
