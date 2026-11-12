import { db } from './prisma';
import type { NotificationsRepository } from './notificationsRepository';

export const prismaNotificationsRepository: NotificationsRepository = {
  listForUser: (userId) =>
    db().notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userId: true, message: true, link: true, createdAt: true, readAt: true },
    }),
  notify: async ({ userId, message, link = null }) => {
    await db().notification.create({ data: { userId, message, link } });
  },
  markRead: async (id, userId) => {
    const mine = await db().notification.findFirst({ where: { id, userId }, select: { id: true } });
    if (!mine) {
      return false;
    }
    // Only the first time counts: an already opened notification keeps its date.
    await db().notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return true;
  },
};
