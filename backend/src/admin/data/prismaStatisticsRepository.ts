import type { Prisma } from '@prisma/client';
import { db } from '../../core/data/prisma';
import { toTimeFilter } from '../logic/toTimeFilter';
import type { StatisticsRepository } from './statisticsRepository';

/** In Bienestar, not returned yet, and nobody said "Pasaré a recoger". */
const UNCLAIMED_ITEM: Prisma.FoundItemWhereInput = {
  status: { in: ['IN_CUSTODY', 'PUBLISHED'] },
  matches: { none: { status: 'WILL_PICK_UP' } },
};

export const prismaStatisticsRepository: StatisticsRepository = {
  countUsage: async (range) => {
    const time = range && toTimeFilter(range);
    const [foundItems, lostReports, deliveredItems, unclaimedItems] = await Promise.all([
      db().foundItem.count({ where: { createdAt: time } }),
      db().lostReport.count({ where: { createdAt: time } }),
      db().delivery.count({ where: { deliveredAt: time } }),
      db().foundItem.count({ where: UNCLAIMED_ITEM }),
    ]);
    return { foundItems, lostReports, deliveredItems, unclaimedItems };
  },
};
