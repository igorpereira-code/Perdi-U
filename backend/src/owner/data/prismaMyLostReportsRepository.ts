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
};