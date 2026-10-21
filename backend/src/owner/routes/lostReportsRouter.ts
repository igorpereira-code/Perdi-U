import { Router } from 'express';
import { getCurrentUser } from '../../core/currentUser';
import type { FoundItemCatalogs } from '../../finder/data/foundItemsRepository';
import type { FoundItemPhotoStorage } from '../../finder/data/foundItemPhotoStorage';
import type { LostReportsRepository } from '../data/lostReportsRepository';
import { validateLostReport } from '../logic/validateLostReport';

export function createLostReportsRouter(
  lostReports: LostReportsRepository,
  getCatalogs: () => Promise<FoundItemCatalogs>,
  _photos: FoundItemPhotoStorage,
): Router {
  const router = Router();

  router.post('/lost-reports', async (req, res) => {
    try {
      const result = validateLostReport(req.body, await getCatalogs());
      if (!result.valid) {
        res.status(400).json({ error: 'Revisa los datos del reporte.', errors: result.errors });
        return;
      }
      const created = await lostReports.create({ ...result.data, ownerId: getCurrentUser(req).id });
      res.status(201).json(created);
    } catch {
      res.status(500).json({ error: 'No se pudo registrar tu reporte. Intenta nuevamente.' });
    }
  });

  return router;
}