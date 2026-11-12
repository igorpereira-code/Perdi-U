import { Router } from 'express';
import type { Role } from '@shared/user';
import { requireRole } from '../../core/currentUser';
import type { AdminUsersRepository } from '../data/adminUsersRepository';
import { isAllowedRoleChange } from '../logic/isAllowedRoleChange';

const ROLES: Role[] = ['COMMUNITY', 'WELFARE', 'ADMIN'];

function isRole(value: unknown): value is Role {
  return ROLES.includes(value as Role);
}

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

  router.patch('/admin/users/:id/role', requireRole('ADMIN'), async (req, res) => {
    const newRole: unknown = req.body?.role;
    if (!isRole(newRole)) {
      res.status(400).json({ error: 'El rol no es válido.' });
      return;
    }
    try {
      const user = await adminUsers.findUser(String(req.params.id));
      if (!user) {
        res.status(404).json({ error: 'No encontramos a este usuario.' });
        return;
      }
      if (!isAllowedRoleChange(user.role, newRole)) {
        res.status(409).json({ error: 'No se puede hacer este cambio de rol.' });
        return;
      }
      res.json(await adminUsers.changeRole(user.id, newRole));
    } catch {
      res.status(503).json({ error: 'No se pudo cambiar el rol. Intenta nuevamente.' });
    }
  });

  return router;
}
