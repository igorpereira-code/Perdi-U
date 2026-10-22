import { Router } from 'express';
import { getCurrentUser } from '../../core/currentUser';
import type { MyLostReport, MyLostReportsRepository } from '../data/myLostReportsRepository';

function toView(report: MyLostReport) {
  return {
    ...report,
    dateFrom: report.dateFrom.toISOString().slice(0, 10),
    dateTo: report.dateTo.toISOString().slice(0, 10),
  };
}

export function createMyLostReportsRouter(reports: MyLostReportsRepository): Router {
  const router = Router();

  router.get('/my-lost-reports', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      res.json((await reports.listMine(getCurrentUser(req).id)).map(toView));
    } catch {
      res.status(503).json({ error: 'No se pudieron cargar tus reportes. Intenta nuevamente.' });
    }
  });

  return router;
}