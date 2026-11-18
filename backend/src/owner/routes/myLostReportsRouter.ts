import { Router } from 'express';
import { getCurrentUser } from '../../core/currentUser';
import type { FoundItemCatalogs } from '../../finder/data/foundItemsRepository';
import type {
  EditableLostReport,
  MyLostReport,
  MyLostReportsRepository,
} from '../data/myLostReportsRepository';
import { validateLostReport } from '../logic/validateLostReport';

const NOT_FOUND = 'No encontramos este reporte.';

/** The day of a date, as "YYYY-MM-DD". */
function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The code as the owner may have typed it: " pr-0007 " is PR-0007. */
function readCode(code: unknown): string {
  return String(code).trim().toUpperCase();
}

function toMyLostReportView(report: MyLostReport) {
  return { ...report, dateFrom: toDay(report.dateFrom), dateTo: toDay(report.dateTo) };
}

function toEditableView(report: EditableLostReport) {
  return { ...report, dateFrom: toDay(report.dateFrom), dateTo: toDay(report.dateTo) };
}

export function createMyLostReportsRouter(
  reports: MyLostReportsRepository,
  getCatalogs: () => Promise<FoundItemCatalogs>,
): Router {
  const router = Router();

  router.get('/my-lost-reports', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      res.json((await reports.listMine(getCurrentUser(req).id)).map(toMyLostReportView));
    } catch {
      res.status(503).json({ error: 'No se pudieron cargar tus reportes. Intenta nuevamente.' });
    }
  });

  router.get('/my-lost-reports/:code', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      const report = await reports.findMine(getCurrentUser(req).id, readCode(req.params.code));
      if (!report) {
        res.status(404).json({ error: NOT_FOUND });
        return;
      }
      res.json(toMyLostReportView(report));
    } catch {
      res.status(503).json({ error: 'No se pudo cargar el reporte. Intenta nuevamente.' });
    }
  });

  router.get('/my-lost-reports/:code/edit', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      const report = await reports.findEditable(getCurrentUser(req).id, readCode(req.params.code));
      if (!report) {
        res.status(404).json({ error: NOT_FOUND });
        return;
      }
      res.json(toEditableView(report));
    } catch {
      res.status(503).json({ error: 'No se pudo cargar el reporte para editar. Intenta nuevamente.' });
    }
  });

  router.patch('/my-lost-reports/:code', async (req, res) => {
    try {
      const result = validateLostReport(req.body, await getCatalogs());
      if (!result.valid) {
        res.status(400).json({ error: 'Revisa los datos del reporte.', errors: result.errors });
        return;
      }
      const updated = await reports.updateMine(
        getCurrentUser(req).id,
        readCode(req.params.code),
        result.data,
      );
      if (!updated) {
        res.status(404).json({ error: NOT_FOUND });
        return;
      }
      res.json({ updated: true });
    } catch {
      res.status(503).json({ error: 'No se pudieron guardar los cambios. Intenta nuevamente.' });
    }
  });

  router.post('/my-lost-reports/:code/close', async (req, res) => {
    try {
      const result = await reports.closeMine(getCurrentUser(req).id, readCode(req.params.code));
      if (result === 'NOT_FOUND') {
        res.status(404).json({ error: NOT_FOUND });
        return;
      }
      if (result === 'ALREADY_FINISHED') {
        res.status(409).json({ error: 'Este reporte ya fue cerrado o recuperado.' });
        return;
      }
      res.json({ closed: true });
    } catch {
      res.status(503).json({ error: 'No se pudo cerrar el reporte. Intenta nuevamente.' });
    }
  });

  return router;
}
