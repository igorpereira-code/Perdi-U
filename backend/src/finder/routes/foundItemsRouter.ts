import { randomUUID } from 'node:crypto';
import { raw, Router, type ErrorRequestHandler } from 'express';
import { getCurrentUser } from '../../core/currentUser';
import type { FoundItemsRepository } from '../data/foundItemsRepository';
import { validateFoundItemReport } from '../logic/validateFoundItemReport';
import type { FoundItemPhotoStorage } from '../data/foundItemPhotoStorage';
import { canViewFoundItemPhoto } from '../logic/canViewFoundItemPhoto';
import { FoundItemRequestError } from '../logic/validateFoundItemPhoto';
import { readFoundItemRequest } from './readFoundItemRequest';

const PHOTO_URL_TTL_SECONDS = 60;

export function createFoundItemsRouter(foundItems: FoundItemsRepository, photos: FoundItemPhotoStorage): Router {
  const router = Router();

  router.get('/my-found-items', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      res.json(await foundItems.listMine(getCurrentUser(req).id));
    } catch {
      res.status(503).json({ error: 'No se pudieron cargar tus reportes. Intenta nuevamente.' });
    }
  });

  router.get('/my-found-items/:code', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const code = String(req.params.code);
    if (!/^HZ-\d+$/.test(code)) {
      res.status(404).json({ error: 'No encontramos este reporte.' });
      return;
    }
    try {
      const item = await foundItems.getMineByCode(getCurrentUser(req).id, code);
      if (!item) {
        res.status(404).json({ error: 'No encontramos este reporte.' });
        return;
      }
      res.json(item);
    } catch {
      res.status(503).json({ error: 'No se pudo cargar el reporte. Intenta nuevamente.' });
    }
  });

  router.get('/my-found-items/:code/edit', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      const report = await foundItems.getEditable(getCurrentUser(req).id, String(req.params.code));
      if (!report) {
        res.status(404).json({ error: 'El reporte no está disponible para editar.' });
        return;
      }
      res.json(report);
    } catch {
      res.status(503).json({ error: 'No se pudo cargar el reporte para editar.' });
    }
  });

  router.patch('/my-found-items/:code', async (req, res) => {
    try {
      const validation = validateFoundItemReport(req.body, await foundItems.getCatalogs());
      if (!validation.valid) {
        res.status(400).json({ error: 'Revisa los datos del reporte.', errors: validation.errors });
        return;
      }
      const updated = await foundItems.updatePending(getCurrentUser(req).id, String(req.params.code), validation.data);
      if (!updated) {
        res.status(409).json({ error: 'El reporte ya no está disponible para editar.' });
        return;
      }
      res.json({ updated: true });
    } catch {
      res.status(503).json({ error: 'No se pudieron guardar los cambios. Intenta nuevamente.' });
    }
  });

  router.delete('/my-found-items/:code', async (req, res) => {
    try {
      const cancelled = await foundItems.cancelPending(getCurrentUser(req).id, String(req.params.code));
      if (!cancelled) {
        res.status(409).json({ error: 'El reporte ya no está disponible para cancelar.' });
        return;
      }
      res.json({ cancelled: true });
    } catch {
      res.status(503).json({ error: 'No se pudo cancelar el reporte. Intenta nuevamente.' });
    }
  });

  router.get('/found-items/:code/photo', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      const item = await foundItems.getPhotoByCode(String(req.params.code));
      if (!item?.photoUrl) {
        res.status(404).json({ error: 'No se encontró una fotografía para este reporte.' });
        return;
      }
      if (!canViewFoundItemPhoto(item, getCurrentUser(req))) {
        res.status(403).json({ error: 'No tienes permiso para consultar esta fotografía.' });
        return;
      }
      if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(png|jpg|webp)$/.test(item.photoUrl)) {
        res.status(404).json({ error: 'No se encontró una fotografía para este reporte.' });
        return;
      }
      const url = await photos.createSignedUrl(item.photoUrl, PHOTO_URL_TTL_SECONDS);
      res.json({ url, expiresIn: PHOTO_URL_TTL_SECONDS });
    } catch {
      res.status(503).json({ error: 'No se pudo consultar la fotografía. Intenta nuevamente.' });
    }
  });

  router.get('/found-items/catalogs', async (_req, res) => {
    try {
      res.json(await foundItems.getCatalogs());
    } catch {
      res.status(500).json({ error: 'No se pudieron cargar las categorías y ubicaciones. Intenta nuevamente.' });
    }
  });

  router.post('/found-items', raw({ type: 'multipart/form-data', limit: 6 * 1024 * 1024 }), async (req, res) => {
    let photoPath: string | undefined;
    let isReportSaved = false;
    let isPhotoUploading = false;
    try {
      const { report, photo } = await readFoundItemRequest(req);
      const catalogs = await foundItems.getCatalogs();
      const validation = validateFoundItemReport(report, catalogs);
      if (!validation.valid) {
        res.status(400).json({ error: 'Revisa los datos del reporte.', errors: validation.errors });
        return;
      }

      const finderId = getCurrentUser(req).id;
      if (photo) {
        const newPath = `${finderId}/${randomUUID()}.${photo.extension}`;
        isPhotoUploading = true;
        await photos.upload(newPath, photo.bytes, photo.contentType);
        photoPath = newPath;
        isPhotoUploading = false;
      }
      const item = await foundItems.create({
        ...validation.data, finderId, ...(photoPath ? { photoUrl: photoPath } : {}),
      });
      isReportSaved = true;
      res.status(201).json(item);
    } catch (error) {
      if (photoPath && !isReportSaved) {
        try { await photos.remove(photoPath); } catch { /* Compensación de mejor esfuerzo: no ocultar el error original. */ }
      }
      if (error instanceof FoundItemRequestError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      if (isPhotoUploading) {
        res.status(503).json({ error: 'No se pudo subir la fotografía. Intenta nuevamente.' });
        return;
      }
      res.status(500).json({ error: 'No se pudo registrar el objeto encontrado. Intenta nuevamente.' });
    }
  });

  const handlePhotoBodyError: ErrorRequestHandler = (error, _req, res, next) => {
    if (error?.type === 'entity.too.large') {
      res.status(413).json({ error: 'La fotografía debe pesar como máximo 5 MiB.' });
      return;
    }
    next(error);
  };
  router.use(handlePhotoBodyError);

  return router;
}
