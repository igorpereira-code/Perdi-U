import { Router } from 'express';
import type { CatalogItem, CatalogRepository } from '../data/catalogRepository';
import { isInCatalog } from '../logic/isInCatalog';

function toView(item: CatalogItem) {
  const { status: _status, visibility: _visibility, ...view } = item;
  return { ...view, foundAt: item.foundAt.toISOString() };
}

export function createCatalogRouter(catalog: CatalogRepository): Router {
  const router = Router();

  router.get('/catalog', async (_req, res) => {
    try {
      const items = await catalog.listPublished();
      res.json(items.filter(isInCatalog).map(toView));
    } catch {
      res.status(503).json({ error: 'No se pudieron cargar los objetos encontrados. Intenta nuevamente.' });
    }
  });

  router.get('/catalog/:code', async (req, res) => {
    try {
      const item = await catalog.findByCode(String(req.params.code).trim().toUpperCase());
      if (!item || !isInCatalog(item)) {
        res.status(404).json({ error: 'No encontramos este objeto.' });
        return;
      }
      res.json(toView(item));
    } catch {
      res.status(503).json({ error: 'No se pudo cargar el objeto. Intenta nuevamente.' });
    }
  });

  return router;
}