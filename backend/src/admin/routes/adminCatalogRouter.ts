import { Router, type RequestHandler } from 'express';
import { requireRole } from '../../core/currentUser';
import type { AdminCatalogRepository } from '../data/adminCatalogRepository';

export function createAdminCatalogRouter(adminCatalog: AdminCatalogRepository): Router {
  const router = Router();

  const listCatalogs: RequestHandler = async (_req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      res.json(await adminCatalog.listCatalogs());
    } catch {
      res.status(503).json({
        error: 'No se pudieron cargar las categorías y lugares. Intenta nuevamente.',
      });
    }
  };

  router.get('/admin/catalogs', requireRole('ADMIN'), listCatalogs);

  return router;
}
