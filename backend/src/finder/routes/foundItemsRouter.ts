import { Router } from 'express';
import { getCurrentUser } from '../../core/currentUser';
import type { FoundItemsRepository } from '../data/foundItemsRepository';
import { validateFoundItemReport } from '../logic/validateFoundItemReport';

export function createFoundItemsRouter(foundItems: FoundItemsRepository): Router {
  const router = Router();

  router.get('/found-items/catalogs', async (_req, res) => {
    try {
      res.json(await foundItems.getCatalogs());
    } catch {
      res.status(500).json({ error: 'No se pudieron cargar las categorías y ubicaciones. Intenta nuevamente.' });
    }
  });

  router.post('/found-items', async (req, res) => {
    try {
      const catalogs = await foundItems.getCatalogs();
      const result = validateFoundItemReport(req.body, catalogs);
      if (!result.valid) {
        res.status(400).json({ error: 'Revisa los datos del reporte.', errors: result.errors });
        return;
      }

      const item = await foundItems.create({ ...result.data, finderId: getCurrentUser(req).id });
      res.status(201).json(item);
    } catch {
      res.status(500).json({ error: 'No se pudo registrar el objeto encontrado. Intenta nuevamente.' });
    }
  });

  return router;
}
