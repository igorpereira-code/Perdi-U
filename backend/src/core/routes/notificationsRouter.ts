import { Router } from 'express';
import type { AppNotification } from '@shared/notifications';
import { getCurrentUser } from '../currentUser';
import type { NotificationsRepository, StoredNotification } from '../data/notificationsRepository';
import { sortNewestFirst } from '../logic/newestFirst';

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
      res.json(sortNewestFirst(mine).map(toView));
    } catch {
      res.status(503).json({ error: 'No se pudieron cargar tus avisos. Intenta nuevamente.' });
    }
  });

  router.post('/me/notifications/:id/read', async (req, res) => {
    try {
      const found = await notifications.markRead(String(req.params.id), getCurrentUser(req).id);
      if (!found) {
        res.status(404).json({ error: 'No encontramos este aviso.' });
        return;
      }
      res.sendStatus(204);
    } catch {
      res.status(503).json({ error: 'No se pudo marcar el aviso como leído.' });
    }
  });

  return router;
}
