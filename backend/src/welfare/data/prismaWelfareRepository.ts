import { db } from '../../core/data/prisma';
import type { WelfareFoundItem } from './welfareRepository';
import type { WelfareRepository } from './welfareRepository';

const foundItemRelations = {
  category: { select: { name: true } },
  place: { select: { name: true } },
  classroom: { select: { name: true } },
  finder: { select: { name: true, email: true } },
} as const;

type FoundItemRow = {
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

function toWelfareFoundItem(foundItemRow: FoundItemRow): WelfareFoundItem {
  return {
    id: foundItemRow.id,
    code: foundItemRow.code,
    description: foundItemRow.description,
    photoUrl: foundItemRow.photoUrl,
    category: foundItemRow.category.name,
    place: foundItemRow.place.name,
    classroom: foundItemRow.classroom?.name ?? null,
    placeReference: foundItemRow.placeReference,
    foundAt: foundItemRow.foundAt,
    status: foundItemRow.status,
    finder: foundItemRow.finder,
    receivedById: foundItemRow.receivedById ?? undefined,
    receivedAt: foundItemRow.receivedAt ?? undefined,
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
    }).then((lostReports) =>
      lostReports.map((lostReport) => ({
        ...lostReport,
        category: lostReport.category.name,
      })),
    ),

  findActiveLostReportByCode: async (code) => {
    const lostReport = await db().lostReport.findFirst({
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
    return lostReport ? { ...lostReport, category: lostReport.category.name } : null;
  },

  listPendingPickups: async () => {
    const pendingPickupRows = await db().match.findMany({
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
    return pendingPickupRows.map((pendingPickupRow) => ({
      matchId: pendingPickupRow.id,
      owner: pendingPickupRow.lostReport.owner,
      report: { code: pendingPickupRow.lostReport.code },
      foundItem: pendingPickupRow.foundItem,
    }));
  },

  listPending: async () => {
    const pendingItemRows = await db().foundItem.findMany({
      where: { status: 'PENDING_DROP_OFF' },
      include: foundItemRelations,
      orderBy: { createdAt: 'asc' },
    });
    return pendingItemRows.map(toWelfareFoundItem);
  },

  listInOffice: async () => {
    const inOfficeItemRows = await db().foundItem.findMany({
      where: { status: { in: ['IN_CUSTODY', 'PUBLISHED'] } },
      include: foundItemRelations,
      orderBy: { receivedAt: 'asc' },
    });
    return inOfficeItemRows.map(toWelfareFoundItem);
  },

  findFoundItemByCode: async (code) => {
    const foundItemRow = await db().foundItem.findUnique({
      where: { code },
      include: foundItemRelations,
    });
    return foundItemRow ? toWelfareFoundItem(foundItemRow) : null;
  },

  confirmPendingReception: async (itemId, receivedById, receivedAt) => {
    const updatedItems = await db().foundItem.updateMany({
      where: { id: itemId, status: 'PENDING_DROP_OFF' },
      data: { status: 'IN_CUSTODY', receivedById, receivedAt },
    });
    return updatedItems.count === 1;
  },

  deliver: async (delivery) =>
    db().$transaction(async (transaction) => {
      const foundItem = await transaction.foundItem.findFirst({
        where: {
          code: delivery.foundItemCode,
          status: { in: ['IN_CUSTODY', 'PUBLISHED'] },
          delivery: null,
        },
        select: { id: true, code: true },
      });
      if (!foundItem) {
        return { status: 'ITEM_NOT_AVAILABLE' } as const;
      }

      const lostReport = delivery.lostReportCode
        ? await transaction.lostReport.findFirst({
            where: {
              code: delivery.lostReportCode,
              status: 'PENDING_PICKUP',
              delivery: null,
              owner: { email: delivery.recipientEmail },
              matches: {
                some: { foundItemId: foundItem.id, status: 'WILL_PICK_UP' },
              },
            },
            select: { id: true },
          })
        : null;
      if (delivery.lostReportCode && !lostReport) {
        return { status: 'REPORT_NOT_ELIGIBLE' } as const;
      }

      const recipient = await transaction.user.findUnique({
        where: { email: delivery.recipientEmail },
        select: { id: true },
      });
      await transaction.delivery.create({
        data: {
          foundItemId: foundItem.id,
          lostReportId: lostReport?.id,
          recipientName: delivery.recipientName,
          recipientEmail: delivery.recipientEmail,
          recipientUniversityCode: delivery.recipientUniversityCode,
          recipientUserId: recipient?.id,
          registeredById: delivery.registeredById,
          deliveredAt: delivery.deliveredAt,
        },
      });
      await transaction.foundItem.update({
        where: { id: foundItem.id },
        data: { status: 'DELIVERED', visibility: 'HIDDEN' },
      });
      if (lostReport) {
        await transaction.lostReport.update({
          where: { id: lostReport.id },
          data: { status: 'RECOVERED' },
        });
      }

      return { status: 'DELIVERED', foundItemCode: foundItem.code } as const;
    }),
} satisfies WelfareRepository;
