import { db } from './prisma';
import type { NotificationsRepository } from './notificationsRepository';

export const prismaNotificationsRepository: NotificationsRepository = {
  listForUser: (userId) =>
    db().notification.findMany({
      where: { userId },
      select: { id: true, userId: true, message: true, link: true, createdAt: true, readAt: true },
    }),
  notify: async ({ userId, message, link = null }) => {
    await db().notification.create({ data: { userId, message, link } });
  },
};
