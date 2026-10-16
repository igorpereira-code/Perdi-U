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
};
