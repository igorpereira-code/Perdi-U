import { db } from '../../core/data/prisma';
import type { StatisticsRepository } from './statisticsRepository';

export const prismaStatisticsRepository: StatisticsRepository = {
  countUsage: async () => {
    const [foundItems, lostReports, deliveredItems] = await Promise.all([
      db().foundItem.count(),
      db().lostReport.count(),
      db().delivery.count(),
    ]);
    return { foundItems, lostReports, deliveredItems };
  },
};
