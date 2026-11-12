import type { FoundItemStatus } from '@shared/statuses';
import { db } from '../../core/data/prisma';
import type { CatalogItem, CatalogRepository } from './catalogRepository';

const catalogSelect = {
  code: true,
  description: true,
  placeReference: true,
  foundAt: true,
  photoUrl: true,
  status: true,
  visibility: true,
  category: { select: { name: true } },
  place: { select: { name: true } },
  classroom: { select: { name: true } },
} as const;

type StoredCatalogItem = {
  code: string;
  description: string;
  placeReference: string | null;
  foundAt: Date;
  photoUrl: string | null;
  status: FoundItemStatus;
  visibility: 'VISIBLE' | 'HIDDEN';
  category: { name: string };
  place: { name: string };
  classroom: { name: string } | null;
};

function toCatalogItem(item: StoredCatalogItem): CatalogItem {
  return {
    code: item.code,
    description: item.description,
    category: item.category.name,
    place: item.classroom ? `${item.place.name} – ${item.classroom.name}` : item.place.name,
    placeReference: item.placeReference,
    foundAt: item.foundAt,
    hasPhoto: Boolean(item.photoUrl),
    status: item.status,
    visibility: item.visibility,
  };
}

export const prismaCatalogRepository: CatalogRepository = {
  listPublished: async () => {
    const items = await db().foundItem.findMany({
      where: { status: 'PUBLISHED', visibility: 'VISIBLE' },
      select: catalogSelect,
      orderBy: [{ publishedAt: 'desc' }, { code: 'desc' }],
    });
    return items.map(toCatalogItem);
  },
  findByCode: async (code) => {
    const item = await db().foundItem.findUnique({ where: { code }, select: catalogSelect });
    return item ? toCatalogItem(item) : null;
  },
};