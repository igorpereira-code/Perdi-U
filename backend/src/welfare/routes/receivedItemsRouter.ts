import { Router } from 'express';
import type { WelfareFoundItemView, WelfareLostReportView } from '@shared/welfare';
import { getCurrentUser, requireRole } from '../../core/currentUser';
import { isInstitutionalEmail } from '../../core/logic/institutionalEmail';
import type { WelfareFoundItem, WelfareRepository } from '../data/welfareRepository';

function toView(item: WelfareFoundItem): WelfareFoundItemView {
  const { id: _id, receivedById: _receivedById, receivedAt: _receivedAt, ...view } = item;
  return { ...view, foundAt: item.foundAt.toISOString() };
}

function toLostReportView(
  report: Awaited<ReturnType<WelfareRepository['listActiveLostReports']>>[number],
): WelfareLostReportView {
  const { id: _id, ...view } = report;
  return {
    ...view,
    dateFrom: report.dateFrom.toISOString(),
    dateTo: report.dateTo.toISOString(),
  };
}

function normalizeCode(value: unknown): string {
  return String(value).trim().toUpperCase();
}

function requiredText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function createReceivedItemsRouter(welfare: WelfareRepository): Router {
  const router = Router();

  router.get('/welfare/lost-reports', requireRole('WELFARE'), async (_req, res) => {
    res.json((await welfare.listActiveLostReports()).map(toLostReportView));
  });

  router.get('/welfare/lost-reports/:code', requireRole('WELFARE'), async (req, res) => {
    const report = await welfare.findActiveLostReportByCode(normalizeCode(req.params.code));
    if (!report) {
      res.status(404).json({ code: 'LOST_REPORT_NOT_FOUND' });
      return;
    }
    res.json(toLostReportView(report));
  });

  router.get('/welfare/pending-pickups', requireRole('WELFARE'), async (_req, res) => {
    res.json(await welfare.listPendingPickups());
  });

  router.post('/welfare/deliveries', requireRole('WELFARE'), async (req, res) => {
    const rawFoundItemCode = requiredText(req.body.foundItemCode);
    const foundItemCode = rawFoundItemCode ? normalizeCode(rawFoundItemCode) : '';
    const recipientName = requiredText(req.body.recipientName);
    const recipientEmail = requiredText(req.body.recipientEmail).toLowerCase();
    const recipientUniversityCode = requiredText(req.body.recipientUniversityCode);
    if (!foundItemCode || !recipientName || !recipientEmail || !recipientUniversityCode) {
      res.status(400).json({ code: 'INVALID_DELIVERY_DATA' });
      return;
    }
    if (!isInstitutionalEmail(recipientEmail)) {
      res.status(400).json({ code: 'INVALID_RECIPIENT_EMAIL' });
      return;
    }
    const result = await welfare.deliver({
      foundItemCode,
      lostReportCode: req.body.lostReportCode ? normalizeCode(req.body.lostReportCode) : null,
      recipientName,
      recipientEmail,
      recipientUniversityCode,
      registeredById: getCurrentUser(req).id,
      deliveredAt: new Date(),
    });
    if (result.status !== 'DELIVERED') {
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
