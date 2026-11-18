import { db } from '../../core/data/prisma';
import type { ReceptionCorrection, WelfareFoundItem } from './welfareRepository';
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
  visibility: WelfareFoundItem['visibility'];
  receivedById: string | null;
  receivedAt: Date | null;
  category: { name: string };
  categoryId: number;
  place: { name: string };
  placeId: number;
  classroom: { name: string } | null;
  classroomId: number | null;
  finder: { name: string; email: string } | null;
};

function toWelfareFoundItem(foundItemRow: FoundItemRow): WelfareFoundItem {
  return {
    id: foundItemRow.id,
    code: foundItemRow.code,
    description: foundItemRow.description,
    photoUrl: foundItemRow.photoUrl,
    category: foundItemRow.category.name,
    categoryId: foundItemRow.categoryId,
    place: foundItemRow.place.name,
    placeId: foundItemRow.placeId,
    classroom: foundItemRow.classroom?.name ?? null,
    classroomId: foundItemRow.classroomId,
    placeReference: foundItemRow.placeReference,
    foundAt: foundItemRow.foundAt,
    status: foundItemRow.status,
    visibility: foundItemRow.visibility,
    finder: foundItemRow.finder,
    receivedById: foundItemRow.receivedById ?? undefined,
    receivedAt: foundItemRow.receivedAt ?? undefined,
  };
}

export const prismaWelfareRepository = {
  listActiveLostReports: async () =>
    db()
      .lostReport.findMany({
        where: { status: { notIn: ['RECOVERED', 'CLOSED'] } },
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
      })
      .then((lostReports) =>
        lostReports.map((lostReport) => ({
          ...lostReport,
          category: lostReport.category.name,
        })),
      ),

  findActiveLostReportByCode: async (code) => {
    const lostReport = await db().lostReport.findFirst({
      where: { code, status: { notIn: ['RECOVERED', 'CLOSED'] } },
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

  listDeliveries: async () => {
    const deliveries = await db().delivery.findMany({
      select: {
        recipientName: true,
        recipientEmail: true,
        recipientUniversityCode: true,
        deliveredAt: true,
        foundItem: { select: { code: true, description: true } },
      },
      orderBy: { deliveredAt: 'desc' },
    });
    return deliveries.map((delivery) => ({
      foundItem: delivery.foundItem,
      recipient: {
        name: delivery.recipientName,
        email: delivery.recipientEmail,
        universityCode: delivery.recipientUniversityCode,
      },
      deliveredAt: delivery.deliveredAt.toISOString(),
    }));
  },

  listPending: async () => {
    const pendingItemRows = await db().foundItem.findMany({
      where: { status: 'PENDING_DROP_OFF', visibility: 'VISIBLE' },
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
    const foundItemRow = await db().foundItem.findFirst({
      where: { code, OR: [{ status: { not: 'PENDING_DROP_OFF' } }, { visibility: 'VISIBLE' }] },
      include: foundItemRelations,
    });
    return foundItemRow ? toWelfareFoundItem(foundItemRow) : null;
  },

  registerFoundItem: async (registration) => {
    const createdItem = await db().foundItem.create({
      data: {
        description: registration.description,
        photoUrl: registration.photoUrl,
        categoryId: registration.categoryId,
        placeId: registration.placeId,
        classroomId: registration.classroomId,
        placeReference: registration.placeReference,
        foundAt: registration.foundAt,
        status: 'IN_CUSTODY',
        finderId: null,
        receivedById: registration.receivedById,
        receivedAt: registration.receivedAt,
      },
      select: { code: true, status: true },
    });
    return { code: createdItem.code, status: 'IN_CUSTODY' };
  },

  confirmPendingReception: async (
    itemId: string,
    receivedById: string,
    receivedAt: Date,
    correction?: ReceptionCorrection,
  ) =>
    db().$transaction(async (transaction) => {
      const updatedItems = await transaction.foundItem.updateMany({
        where: { id: itemId, status: 'PENDING_DROP_OFF', visibility: 'VISIBLE' },
        data: { status: 'IN_CUSTODY', receivedById, receivedAt, ...correction },
      });
      if (updatedItems.count !== 1) {
        return null;
      }

      const foundItem = await transaction.foundItem.findUniqueOrThrow({
        where: { id: itemId },
        include: foundItemRelations,
      });
      if (foundItem.finderId) {
        await transaction.notification.create({
          data: {
            userId: foundItem.finderId,
            message:
              'Bienestar Estudiantil recibió el objeto de tu reporte ' + foundItem.code + '.',
            link: '/mis-reportes/encontrados/' + encodeURIComponent(foundItem.code),
          },
        });
      }
      return toWelfareFoundItem(foundItem);
    }),

  deletePending: async (itemId) => {
    const deletedItems = await db().foundItem.deleteMany({
      where: { id: itemId, status: 'PENDING_DROP_OFF' },
    });
    return deletedItems.count === 1;
  },

  updatePublishedVisibility: async (itemId, visibility) => {
    const updatedItems = await db().foundItem.updateMany({
      where: { id: itemId, status: 'PUBLISHED' },
      data: { visibility },
    });
    return updatedItems.count === 1;
  },

  updatePublishedDetails: async (itemId, correction) => {
    const updatedItems = await db().foundItem.updateMany({
      where: { id: itemId, status: 'PUBLISHED' },
      data: correction,
    });
    if (updatedItems.count !== 1) {
      return null;
    }
    const foundItem = await db().foundItem.findUnique({
      where: { id: itemId },
      include: foundItemRelations,
    });
    return foundItem ? toWelfareFoundItem(foundItem) : null;
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
      if (recipient) {
        // The owner learns their object was handed over (and, with a report, that it is recovered).
        const recoveredReportCode = lostReport ? delivery.lostReportCode : null;
        await transaction.notification.create({
          data: {
            userId: recipient.id,
            message:
              'Bienestar Estudiantil registró la entrega de tu objeto ' +
              foundItem.code +
              '.' +
              (recoveredReportCode ? ' Tu reporte ' + recoveredReportCode + ' quedó como recuperado.' : ''),
            link: recoveredReportCode ? '/mis-perdidas/' + encodeURIComponent(recoveredReportCode) : null,
          },
        });
      }

      return { status: 'DELIVERED', foundItemCode: foundItem.code } as const;
    }),
} satisfies WelfareRepository;
