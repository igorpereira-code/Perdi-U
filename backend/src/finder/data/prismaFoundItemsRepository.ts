import { db } from '../../core/data/prisma';
import type { FoundItemsRepository, MyFoundItem } from './foundItemsRepository';

const myFoundItemSelect = {
  code: true, description: true, category: { select: { name: true } }, foundAt: true,
  photoUrl: true, status: true, receivedAt: true,
} as const;

type StoredMyFoundItem = Omit<MyFoundItem, 'category' | 'hasPhoto'> & {
  category: { name: string };
  photoUrl: string | null;
};

function toMyFoundItem(item: StoredMyFoundItem): MyFoundItem {
  return {
    code: item.code,
    description: item.description,
    category: item.category.name,
    foundAt: item.foundAt,
    hasPhoto: Boolean(item.photoUrl),
    status: item.status,
    receivedAt: item.receivedAt,
  };
}

export const prismaFoundItemsRepository: FoundItemsRepository = {
  getMineByCode: async (finderId, code) => {
    const item = await db().foundItem.findFirst({
      where: { finderId, code },
      select: myFoundItemSelect,
    });
    return item ? toMyFoundItem(item) : null;
  },
  listMine: async (finderId) => {
    const items = await db().foundItem.findMany({
      where: { finderId },
      select: myFoundItemSelect,
      orderBy: [{ createdAt: 'desc' }, { code: 'desc' }],
    });
    return items.map(toMyFoundItem);
  },
  getPhotoByCode: (code) => db().foundItem.findUnique({
    where: { code },
    select: { finderId: true, photoUrl: true, status: true, visibility: true },
  }),
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
