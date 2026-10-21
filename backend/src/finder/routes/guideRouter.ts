import { Router } from 'express';
import { getCurrentUser } from '../../core/currentUser';
import type { UsersRepository } from '../../core/data/usersRepository';

export function createGuideRouter(users: UsersRepository): Router {
  const router = Router();

  router.post('/me/guide-seen', async (req, res) => {
    try {
      await users.markGuideSeen(getCurrentUser(req).id);
      res.sendStatus(204);
    } catch {
      res.status(500).json({ error: 'No se pudo guardar la guía. Inténtalo de nuevo.' });
    }
  });

  return router;
}
