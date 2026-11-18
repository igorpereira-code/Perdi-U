import type { LostReportStatus } from '@shared/statuses';
import { db } from '../../core/data/prisma';
import type { MyLostReport, MyLostReportsRepository } from './myLostReportsRepository';

const myLostReportSelect = {
  code: true,
  description: true,
  status: true,
  placeDescription: true,
  dateFrom: true,
  dateTo: true,
  category: { select: { name: true } },
  places: {
    select: {
      place: { select: { name: true } },
      classroom: { select: { name: true } },
    },
  },
} as const;

type StoredLostReport = {
  code: string;
  description: string;
  status: LostReportStatus;
  placeDescription: string | null;
  dateFrom: Date;
  dateTo: Date;
  category: { name: string };
  places: { place: { name: string }; classroom: { name: string } | null }[];
};

function toMyLostReport(report: StoredLostReport): MyLostReport {
  return {
    code: report.code,
    description: report.description,
    category: report.category.name,
    status: report.status,
    places: report.places.map((chosen) =>
      chosen.classroom ? `${chosen.place.name} – ${chosen.classroom.name}` : chosen.place.name,
    ),
    placeDescription: report.placeDescription,
    dateFrom: report.dateFrom,
    dateTo: report.dateTo,
  };
}

export const prismaMyLostReportsRepository: MyLostReportsRepository = {
  listMine: async (ownerId) => {
    const reports = await db().lostReport.findMany({
      where: { ownerId },
      select: myLostReportSelect,
      orderBy: [{ createdAt: 'desc' }, { code: 'desc' }],
    });
    return reports.map(toMyLostReport);
  },
  findMine: async (ownerId, code) => {
    const report = await db().lostReport.findFirst({ where: { ownerId, code }, select: myLostReportSelect });
    return report ? toMyLostReport(report) : null;
  },
  findEditable: (ownerId, code) =>
    db().lostReport.findFirst({
      where: { ownerId, code },
      select: {
        description: true,
        categoryId: true,
        placeDescription: true,
        dateFrom: true,
        dateTo: true,
        places: { select: { placeId: true, classroomId: true }, orderBy: { id: 'asc' } },
      },
    }),
  /** Updates the data and replaces the places in one transaction, so nothing is left half saved. */
  updateMine: (ownerId, code, changes) =>
    db().$transaction(async (tx) => {
      const report = await tx.lostReport.findFirst({ where: { ownerId, code }, select: { id: true } });
      if (!report) {
        return false;
      }
      await tx.lostReportPlace.deleteMany({ where: { lostReportId: report.id } });
      await tx.lostReport.update({
        where: { id: report.id },
        data: {
          description: changes.description,
          categoryId: changes.categoryId,
          placeDescription: changes.placeDescription,
          dateFrom: changes.dateFrom,
          dateTo: changes.dateTo,
          places: {
            create: changes.places.map(({ placeId, classroomId }) => ({ placeId, classroomId })),
          },
        },
      });
      // Suggestions were computed with the old data: drop the unanswered ones so the
      // matches screen recalculates them. Answered matches (pick up, dismissed) stay.
      await tx.match.deleteMany({ where: { lostReportId: report.id, status: 'SUGGESTED' } });
      const remainingMatches = await tx.match.count({ where: { lostReportId: report.id } });
      if (remainingMatches === 0) {
        await tx.lostReport.updateMany({
          where: { id: report.id, status: 'HAS_MATCHES' },
          data: { status: 'SEARCHING' },
        });
      }
      return true;
    }),
};