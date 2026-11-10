import { Router } from 'express';
import { requireRole } from '../../core/currentUser';
import type { AdminUsersRepository } from '../data/adminUsersRepository';

export function createAdminUsersRouter(adminUsers: AdminUsersRepository): Router {
  const router = Router();

  router.get('/admin/users', requireRole('ADMIN'), async (_req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      res.json(await adminUsers.listUsers());
    } catch {
      res.status(503).json({ error: 'No se pudieron cargar los usuarios. Intenta nuevamente.' });
    }
  });

  return router;
}
