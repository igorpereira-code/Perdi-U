import { Router } from 'express';
import type { WelfareFoundItemView } from '@shared/welfare';
import { requireRole } from '../../core/currentUser';
import type { WelfareFoundItem, WelfareRepository } from '../data/welfareRepository';

function toView(item: WelfareFoundItem): WelfareFoundItemView {
  const { id: _id, ...view } = item;
  return { ...view, foundAt: item.foundAt.toISOString() };
}

export function createReceivedItemsRouter(welfare: WelfareRepository): Router {
  const router = Router();

  router.get('/welfare/found-items/pending', requireRole('WELFARE'), async (_req, res) => {
    res.json((await welfare.listPending()).map(toView));
  });

  router.get('/welfare/found-items/:code', requireRole('WELFARE'), async (req, res) => {
    const code = String(req.params.code).trim().toUpperCase();
    const item = await welfare.findByCode(code);
    if (!item) {
      res.status(404).json({ error: 'Found item not found' });
      return;
    }
    if (item.status !== 'PENDING_DROP_OFF') {
      res.status(409).json({ code: 'ALREADY_RECEIVED' });
      return;
    }
    res.json(toView(item));
  });

  return router;
}
