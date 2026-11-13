import { db } from '../../core/data/prisma';
import { toTimeFilter } from '../logic/toTimeFilter';
import type { StatisticsRepository } from './statisticsRepository';

export const prismaStatisticsRepository: StatisticsRepository = {
  countUsage: async (range) => {
    const time = range && toTimeFilter(range);
    const [foundItems, lostReports, deliveredItems] = await Promise.all([
      db().foundItem.count({ where: { createdAt: time } }),
      db().lostReport.count({ where: { createdAt: time } }),
      db().delivery.count({ where: { deliveredAt: time } }),
    ]);
    return { foundItems, lostReports, deliveredItems };
  },
};
