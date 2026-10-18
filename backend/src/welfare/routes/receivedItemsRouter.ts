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

  return router;
}
