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
  listActiveLostReports: async () =>
    db().lostReport.findMany({
      where: { status: { not: 'RECOVERED' } },
      select: {
        id: true,
        code: true,
        description: true,
        photoUrl: true,
        dateFrom: true,
        dateTo: true,
        status: true,
        category: { select: { name: true } },
        owner: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    }).then((reports) =>
      reports.map((report) => ({
        ...report,
        category: report.category.name,
      })),
    ),

  findActiveLostReportByCode: async (code) => {
    const report = await db().lostReport.findFirst({
      where: { code, status: { not: 'RECOVERED' } },
      select: {
        id: true,
        code: true,
        description: true,
        photoUrl: true,
        dateFrom: true,
        dateTo: true,
        status: true,
        category: { select: { name: true } },
        owner: { select: { name: true, email: true } },
      },
    });
    return report ? { ...report, category: report.category.name } : null;
  },

  listPendingPickups: async () => {
    const rows = await db().match.findMany({
      where: { status: 'WILL_PICK_UP', lostReport: { status: 'PENDING_PICKUP' } },
      select: {
        id: true,
        lostReport: {
          select: { code: true, owner: { select: { name: true, email: true } } },
        },
        foundItem: { select: { code: true, description: true } },
      },
      orderBy: { respondedAt: 'asc' },
    });
    return rows.map((row) => ({
      matchId: row.id,
      owner: row.lostReport.owner,
      report: { code: row.lostReport.code },
      foundItem: row.foundItem,
    }));
  },

  listPending: async () => {
    const rows = await db().foundItem.findMany({
      where: { status: 'PENDING_DROP_OFF' },
      include: itemRelations,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toWelfareItem);
  },

  listInOffice: async () => {
    const rows = await db().foundItem.findMany({
      where: { status: { in: ['IN_CUSTODY', 'PUBLISHED'] } },
      include: itemRelations,
      orderBy: { receivedAt: 'asc' },
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

  deliver: async (delivery) =>
    db().$transaction(async (transaction) => {
      const item = await transaction.foundItem.findFirst({
        where: {
          code: delivery.foundItemCode,
          status: { in: ['IN_CUSTODY', 'PUBLISHED'] },
          delivery: null,
        },
        select: { id: true, code: true },
      });
      if (!item) {
        return { status: 'ITEM_NOT_AVAILABLE' } as const;
      }

      const report = delivery.lostReportCode
        ? await transaction.lostReport.findFirst({
            where: {
              code: delivery.lostReportCode,
              status: 'PENDING_PICKUP',
              delivery: null,
              owner: { email: delivery.recipientEmail },
              matches: {
                some: { foundItemId: item.id, status: 'WILL_PICK_UP' },
              },
            },
            select: { id: true },
          })
        : null;
      if (delivery.lostReportCode && !report) {
        return { status: 'REPORT_NOT_ELIGIBLE' } as const;
      }

      const recipient = await transaction.user.findUnique({
        where: { email: delivery.recipientEmail },
        select: { id: true },
      });
      await transaction.delivery.create({
        data: {
          foundItemId: item.id,
          lostReportId: report?.id,
          recipientName: delivery.recipientName,
          recipientEmail: delivery.recipientEmail,
          recipientUniversityCode: delivery.recipientUniversityCode,
          recipientUserId: recipient?.id,
          registeredById: delivery.registeredById,
          deliveredAt: delivery.deliveredAt,
        },
      });
      await transaction.foundItem.update({
        where: { id: item.id },
        data: { status: 'DELIVERED', visibility: 'HIDDEN' },
      });
      if (report) {
        await transaction.lostReport.update({
          where: { id: report.id },
          data: { status: 'RECOVERED' },
        });
      }

      return { status: 'DELIVERED', foundItemCode: item.code } as const;
    }),
} satisfies WelfareRepository;
