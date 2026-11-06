import { Router } from 'express';
import type { AppNotification } from '@shared/notifications';
import { getCurrentUser } from '../currentUser';
import type { NotificationsRepository, StoredNotification } from '../data/notificationsRepository';
import { newestFirst } from '../logic/newestFirst';

function toView(notification: StoredNotification): AppNotification {
  return {
    id: notification.id,
    message: notification.message,
    link: notification.link,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
  };
}

export function createNotificationsRouter(notifications: NotificationsRepository): Router {
  const router = Router();

  router.get('/me/notifications', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      const mine = await notifications.listForUser(getCurrentUser(req).id);
      res.json(newestFirst(mine).map(toView));
    } catch {
      res.status(503).json({ error: 'No se pudieron cargar tus avisos. Intenta nuevamente.' });
    }
  });

  return router;
}
