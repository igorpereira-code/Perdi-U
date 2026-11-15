import { Router } from 'express';
import type { WelfareFoundItemView, WelfareLostReportView } from '@shared/welfare';
import { getCurrentUser, requireRole } from '../../core/currentUser';
import { isInstitutionalEmail } from '../../core/logic/institutionalEmail';
import type { WelfareFoundItem, WelfareRepository } from '../data/welfareRepository';
import type { ReceptionCorrection } from '../data/welfareRepository';

function toFoundItemView(foundItem: WelfareFoundItem): WelfareFoundItemView {
  const { id: _id, receivedById: _receivedById, receivedAt: _receivedAt, ...view } = foundItem;
  return { ...view, foundAt: foundItem.foundAt.toISOString() };
}

function toLostReportView(
  lostReport: Awaited<ReturnType<WelfareRepository['listActiveLostReports']>>[number],
): WelfareLostReportView {
  const { id: _id, ...view } = lostReport;
  return {
    ...view,
    dateFrom: lostReport.dateFrom.toISOString(),
    dateTo: lostReport.dateTo.toISOString(),
  };
}

function normalizeCode(value: unknown): string {
  return String(value).trim().toUpperCase();
}

function requiredText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readReceptionCorrection(body: unknown): ReceptionCorrection | undefined {
  if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
    return undefined;
  }
  const values = body as Record<string, unknown>;
  const description = requiredText(values.description);
  const categoryId = values.categoryId;
  const placeId = values.placeId;
  const classroomId = values.classroomId;
  const placeReference = values.placeReference == null ? null : requiredText(values.placeReference);
  const foundAt = typeof values.foundAt === 'string' ? new Date(values.foundAt) : new Date(NaN);
  if (
    !description ||
    !Number.isInteger(categoryId) || Number(categoryId) <= 0 ||
    !Number.isInteger(placeId) || Number(placeId) <= 0 ||
    !(classroomId === null || (Number.isInteger(classroomId) && Number(classroomId) > 0)) ||
    Number.isNaN(foundAt.getTime())
  ) {
    return undefined;
  }
  return {
    description,
    categoryId: Number(categoryId),
    placeId: Number(placeId),
    classroomId: classroomId === null ? null : Number(classroomId),
    placeReference: placeReference || null,
    foundAt,
  };
}

export function createReceivedItemsRouter(welfare: WelfareRepository): Router {
  const router = Router();

  router.get('/welfare/lost-reports', requireRole('WELFARE'), async (_req, res) => {
    res.json((await welfare.listActiveLostReports()).map(toLostReportView));
  });

  router.get('/welfare/lost-reports/:code', requireRole('WELFARE'), async (req, res) => {
    const lostReport = await welfare.findActiveLostReportByCode(normalizeCode(req.params.code));
    if (!lostReport) {
      res.status(404).json({ code: 'LOST_REPORT_NOT_FOUND' });
      return;
    }
    res.json(toLostReportView(lostReport));
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
    const deliveryResult = await welfare.deliver({
      foundItemCode,
      lostReportCode: req.body.lostReportCode ? normalizeCode(req.body.lostReportCode) : null,
      recipientName,
      recipientEmail,
      recipientUniversityCode,
      registeredById: getCurrentUser(req).id,
      deliveredAt: new Date(),
    });
    if (deliveryResult.status !== 'DELIVERED') {
      res.status(409).json({ code: deliveryResult.status });
      return;
    }
    res.status(201).json(deliveryResult);
  });

  router.get('/welfare/found-items/pending', requireRole('WELFARE'), async (_req, res) => {
    res.json((await welfare.listPending()).map(toFoundItemView));
  });

  router.get('/welfare/found-items/in-office', requireRole('WELFARE'), async (_req, res) => {
    res.json((await welfare.listInOffice()).map(toFoundItemView));
  });

  router.get('/welfare/found-items/:code', requireRole('WELFARE'), async (req, res) => {
    const foundItemCode = normalizeCode(req.params.code);
    const foundItem = await welfare.findFoundItemByCode(foundItemCode);
    if (!foundItem) {
      res.status(404).json({ error: 'Found item not found' });
      return;
    }
    if (foundItem.status !== 'PENDING_DROP_OFF') {
      res.status(409).json({ code: 'ALREADY_RECEIVED' });
      return;
    }
    res.json(toFoundItemView(foundItem));
  });

  router.delete('/welfare/found-items/:code', requireRole('WELFARE'), async (req, res) => {
    const foundItem = await welfare.findFoundItemByCode(normalizeCode(req.params.code));
    if (!foundItem) {
      res.status(404).json({ code: 'FOUND_ITEM_NOT_FOUND' });
      return;
    }
    if (foundItem.status !== 'PENDING_DROP_OFF' || !(await welfare.deletePending(foundItem.id))) {
      res.status(409).json({ code: 'ALREADY_RECEIVED' });
      return;
    }
    res.status(204).end();
  });

  router.post('/welfare/found-items/:code/receive', requireRole('WELFARE'), async (req, res) => {
    const foundItemCode = normalizeCode(req.params.code);
    const foundItem = await welfare.findFoundItemByCode(foundItemCode);
    if (!foundItem) {
      res.status(404).json({ error: 'Found item not found' });
      return;
    }
    const hasCorrections = req.body && Object.keys(req.body).length > 0;
    const correction = readReceptionCorrection(req.body);
    if (hasCorrections && !correction) {
      res.status(400).json({ code: 'INVALID_RECEPTION_DATA' });
      return;
    }
    const receivedItem = await welfare.confirmPendingReception(
      foundItem.id,
      getCurrentUser(req).id,
      new Date(),
      correction,
    );
    if (!receivedItem) {
      res.status(409).json({ code: 'ALREADY_RECEIVED' });
      return;
    }
    res.json(toFoundItemView(receivedItem));
  });

  return router;
}
