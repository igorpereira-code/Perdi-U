import { db } from '../../core/data/prisma';
import type { WelfareFoundItem } from './welfareRepository';
import type { WelfareRepository } from './welfareRepository';

const itemRelations = {
  category: { select: { name: true } },
  place: { select: { name: true } },
  classroom: { select: { name: true } },
  finder: { select: { name: true, email: true } },
} as const;

type ItemRow = {
  id: string;
  code: string;
  description: string;
  photoUrl: string | null;
  placeReference: string | null;
  foundAt: Date;
  status: WelfareFoundItem['status'];
  receivedById: string | null;
  receivedAt: Date | null;
  category: { name: string };
  place: { name: string };
  classroom: { name: string } | null;
  finder: { name: string; email: string } | null;
};

function toWelfareItem(row: ItemRow): WelfareFoundItem {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    photoUrl: row.photoUrl,
    category: row.category.name,
    place: row.place.name,
    classroom: row.classroom?.name ?? null,
    placeReference: row.placeReference,
    foundAt: row.foundAt,
    status: row.status,
    finder: row.finder,
    receivedById: row.receivedById ?? undefined,
    receivedAt: row.receivedAt ?? undefined,
  };
}

export const prismaWelfareRepository = {
  listPending: async () => {
    const rows = await db().foundItem.findMany({
      where: { status: 'PENDING_DROP_OFF' },
      include: itemRelations,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toWelfareItem);
  },

  findByCode: async (code) => {
    const row = await db().foundItem.findUnique({ where: { code }, include: itemRelations });
    return row ? toWelfareItem(row) : null;
  },

  receivePending: async (itemId, receivedById, receivedAt) => {
    const result = await db().foundItem.updateMany({
      where: { id: itemId, status: 'PENDING_DROP_OFF' },
      data: { status: 'IN_CUSTODY', receivedById, receivedAt },
    });
    return result.count === 1;
  },
} satisfies WelfareRepository;
