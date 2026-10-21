import { Router } from 'express';
import type { CatalogItem, CatalogRepository } from '../data/catalogRepository';

function toView(item: CatalogItem) {
  const { status: _status, visibility: _visibility, ...view } = item;
  return { ...view, foundAt: item.foundAt.toISOString() };
}

export function createCatalogRouter(catalog: CatalogRepository): Router {
  const router = Router();

  router.get('/catalog', async (_req, res) => {
    try {
      const items = await catalog.listPublished();
      res.json(items.map(toView));
    } catch {
      res.status(503).json({ error: 'No se pudieron cargar los objetos encontrados. Intenta nuevamente.' });
    }
  });

  return router;
}