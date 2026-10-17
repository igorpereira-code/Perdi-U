import { Router } from 'express';
import { requireRole } from '../../core/currentUser';
import type { MatchingRepository } from '../data/matchingRepository';
import { canBePublished } from '../logic/canBePublished';

export function createPublishRouter(matching: MatchingRepository): Router {
  const router = Router();

  router.post('/found-items/:code/publish', requireRole('WELFARE'), async (req, res) => {
    const item = await matching.findFoundItemByCode(String(req.params.code));
    if (!item) {
      res.status(404).json({ error: 'Found item not found' });
      return;
    }
    if (!canBePublished(item.status)) {
      res.status(409).json({ code: 'NOT_RECEIVED' });
      return;
    }

    res.json({ code: item.code });
  });

  return router;
}
