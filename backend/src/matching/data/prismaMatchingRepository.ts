import { db } from '../../core/data/prisma';
import type { MatchingRepository } from './matchingRepository';

export const prismaMatchingRepository: MatchingRepository = {
  findOwnLostReport: async (code, ownerId) => {
    const report = await db().lostReport.findFirst({
      where: { code, ownerId },
      include: { places: true },
    });
    if (!report) {
      return null;
    }
    return {
      id: report.id,
      code: report.code,
      categoryId: report.categoryId,
      dateFrom: report.dateFrom,
      dateTo: report.dateTo,
      description: report.description,
      placeIds: report.places.map((place) => place.placeId),
    };
  },

  findLostReportByCode: async (code) => {
    const report = await db().lostReport.findFirst({
      where: { code, status: { not: 'RECOVERED' } },
      include: { places: true },
    });
    if (!report) {
      return null;
    }
    return {
      id: report.id,
      code: report.code,
      categoryId: report.categoryId,
      dateFrom: report.dateFrom,
      dateTo: report.dateTo,
      description: report.description,
      placeIds: report.places.map((place) => place.placeId),
    };
  },

  listPublishedItems: () =>
    db().foundItem.findMany({
      where: { status: 'PUBLISHED', visibility: 'VISIBLE' },
      select: { id: true, categoryId: true, foundAt: true, placeId: true, description: true },
    }),

  saveSuggestions: async (lostReportId, suggestions) => {
    if (suggestions.length === 0) {
      return;
    }
    await db().match.createMany({
      data: suggestions.map(({ foundItemId, similarity }) => ({
        lostReportId,
        foundItemId,
        similarity,
      })),
      skipDuplicates: true,
    });
    await db().lostReport.updateMany({
      where: { id: lostReportId, status: 'SEARCHING' },
      data: { status: 'HAS_MATCHES' },
    });
  },

  listMatches: async (lostReportId) => {
    const rows = await db().match.findMany({
      where: { lostReportId, status: { not: 'DISMISSED' }, foundItem: { status: 'PUBLISHED' } },
      include: { foundItem: { include: { category: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      similarity: row.similarity,
      foundItem: {
        code: row.foundItem.code,
        description: row.foundItem.description,
        photoUrl: row.foundItem.photoUrl,
        category: row.foundItem.category.name,
      },
    }));
  },

  findOwnMatch: async (matchId, ownerId) => {
    const match = await db().match.findFirst({ where: { id: matchId, lostReport: { ownerId } } });
    return match ? { id: match.id, lostReportId: match.lostReportId } : null;
  },

  markWillPickUp: async (matchId) => {
    const match = await db().match.update({
      where: { id: matchId },
      data: { status: 'WILL_PICK_UP', respondedAt: new Date() },
    });
    await db().lostReport.update({
      where: { id: match.lostReportId },
      data: { status: 'PENDING_PICKUP' },
    });
  },

  dismiss: async (matchId) => {
    await db().match.update({
      where: { id: matchId },
      data: { status: 'DISMISSED', respondedAt: new Date() },
    });
  },

  findFoundItemByCode: (code) =>
    db().foundItem.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        status: true,
        categoryId: true,
        foundAt: true,
        placeId: true,
        description: true,
      },
    }),

  publish: async (itemId, publishedById) => {
    await db().foundItem.update({
      where: { id: itemId },
      data: { status: 'PUBLISHED', visibility: 'VISIBLE', publishedById, publishedAt: new Date() },
    });
  },

  listActiveLostReports: async () => {
    const reports = await db().lostReport.findMany({
      where: { status: { in: ['SEARCHING', 'HAS_MATCHES'] } },
      include: { places: true },
    });
    return reports.map((report) => ({
      id: report.id,
      code: report.code,
      categoryId: report.categoryId,
      dateFrom: report.dateFrom,
      dateTo: report.dateTo,
      description: report.description,
      placeIds: report.places.map((place) => place.placeId),
    }));
  },
};
