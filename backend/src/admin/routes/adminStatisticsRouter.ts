import { Router, type RequestHandler } from 'express';
import { requireRole } from '../../core/currentUser';
import type { StatisticsRepository } from '../data/statisticsRepository';

export function createAdminStatisticsRouter(statistics: StatisticsRepository): Router {
  const router = Router();

  const countUsage: RequestHandler = async (_req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      res.json(await statistics.countUsage());
    } catch {
      res.status(503).json({
        error: 'No se pudieron cargar las estadísticas. Intenta nuevamente.',
      });
    }
  };

  router.get('/admin/statistics', requireRole('ADMIN'), countUsage);

  return router;
}
