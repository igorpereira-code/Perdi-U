import { Router } from 'express';
import type { WelfareFoundItemView } from '@shared/welfare';
import { getCurrentUser, requireRole } from '../../core/currentUser';
import type { WelfareFoundItem, WelfareRepository } from '../data/welfareRepository';

function toView(item: WelfareFoundItem): WelfareFoundItemView {
  const { id: _id, receivedById: _receivedById, receivedAt: _receivedAt, ...view } = item;
  return { ...view, foundAt: item.foundAt.toISOString() };
}

function normalizeCode(value: unknown): string {
  return String(value).trim().toUpperCase();
}

export function createReceivedItemsRouter(welfare: WelfareRepository): Router {
  const router = Router();

  router.get('/welfare/pending-pickups', requireRole('WELFARE'), async (_req, res) => {
    res.json(await welfare.listPendingPickups());
  });

  router.post('/welfare/deliveries', requireRole('WELFARE'), async (req, res) => {
    const result = await welfare.deliver({
      foundItemCode: normalizeCode(req.body.foundItemCode),
      lostReportCode: null,
      recipientName: String(req.body.recipientName).trim(),
      recipientEmail: String(req.body.recipientEmail).trim().toLowerCase(),
      recipientUniversityCode: String(req.body.recipientUniversityCode).trim(),
      registeredById: getCurrentUser(req).id,
      deliveredAt: new Date(),
    });
    if (result.status === 'ITEM_NOT_AVAILABLE') {
      res.status(409).json({ code: result.status });
      return;
    }
    res.status(201).json(result);
  });

  router.get('/welfare/found-items/pending', requireRole('WELFARE'), async (_req, res) => {
    res.json((await welfare.listPending()).map(toView));
  });

  router.get('/welfare/found-items/in-office', requireRole('WELFARE'), async (_req, res) => {
    res.json((await welfare.listInOffice()).map(toView));
  });

  router.get('/welfare/found-items/:code', requireRole('WELFARE'), async (req, res) => {
    const code = normalizeCode(req.params.code);
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

  router.post('/welfare/found-items/:code/receive', requireRole('WELFARE'), async (req, res) => {
    const code = normalizeCode(req.params.code);
    const item = await welfare.findByCode(code);
    if (!item) {
      res.status(404).json({ error: 'Found item not found' });
      return;
    }
    const received = await welfare.receivePending(item.id, getCurrentUser(req).id, new Date());
    if (!received) {
      res.status(409).json({ code: 'ALREADY_RECEIVED' });
      return;
    }
    res.json(toView({ ...item, status: 'IN_CUSTODY' }));
  });

  return router;
}
