import { Router, type RequestHandler } from 'express';
import { requireRole } from '../../core/currentUser';
import type { StatisticsRepository } from '../data/statisticsRepository';
import { readDateRange } from '../logic/readDateRange';

export function createAdminStatisticsRouter(statistics: StatisticsRepository): Router {
  const router = Router();

  const countUsage: RequestHandler = async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const result = readDateRange(req.query);
    if ('error' in result) {
      res.status(400).json({ error: result.error });
      return;
    }
    try {
      res.json(await statistics.countUsage(result.range));
    } catch {
      res.status(503).json({
        error: 'No se pudieron cargar las estadísticas. Intenta nuevamente.',
      });
    }
  };

  router.get('/admin/statistics', requireRole('ADMIN'), countUsage);

  return router;
}
