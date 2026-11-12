import { db } from '../../core/data/prisma';
import type { LostReportsRepository } from './lostReportsRepository';

export const prismaLostReportsRepository: LostReportsRepository = {
  create: (report) =>
    db().lostReport.create({
      data: {
        description: report.description,
        categoryId: report.categoryId,
        placeDescription: report.placeDescription,
        dateFrom: report.dateFrom,
        dateTo: report.dateTo,
        ownerId: report.ownerId,
        ...(report.photoUrl ? { photoUrl: report.photoUrl } : {}),
        places: {
          create: report.places.map((place) => ({ placeId: place.placeId, classroomId: place.classroomId })),
        },
      },
      select: { code: true, status: true },
    }),
};