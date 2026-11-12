import { randomUUID } from 'node:crypto';
import { raw, Router } from 'express';
import { getCurrentUser } from '../../core/currentUser';
import type { FoundItemCatalogs } from '../../finder/data/foundItemsRepository';
import type { FoundItemPhotoStorage } from '../../finder/data/foundItemPhotoStorage';
import { FoundItemRequestError } from '../../finder/logic/validateFoundItemPhoto';
import { readFoundItemRequest } from '../../finder/routes/readFoundItemRequest';
import type { LostReportsRepository } from '../data/lostReportsRepository';
import { validateLostReport } from '../logic/validateLostReport';

const MAX_REQUEST_BYTES = 6 * 1024 * 1024;

export function createLostReportsRouter(
  lostReports: LostReportsRepository,
  getCatalogs: () => Promise<FoundItemCatalogs>,
  photos: FoundItemPhotoStorage,
): Router {
  const router = Router();

  router.post('/lost-reports', raw({ type: 'multipart/form-data', limit: MAX_REQUEST_BYTES }), async (req, res) => {
    let photoPath: string | null = null;
    let saved = false;
    try {
      const { report, photo } = await readFoundItemRequest(req);
      const result = validateLostReport(report, await getCatalogs());
      if (!result.valid) {
        res.status(400).json({ error: 'Revisa los datos del reporte.', errors: result.errors });
        return;
      }

      const ownerId = getCurrentUser(req).id;
      if (photo) {
        photoPath = `${ownerId}/${randomUUID()}.${photo.extension}`;
        await photos.upload(photoPath, photo.bytes, photo.contentType);
      }
      const created = await lostReports.create({
        ...result.data,
        ownerId,
        ...(photoPath ? { photoUrl: photoPath } : {}),
      });
      saved = true;
      res.status(201).json(created);
    } catch (error) {
      if (photoPath && !saved) {
        try { await photos.remove(photoPath); } catch { /* Best effort: keep the original error. */ }
      }
      if (error instanceof FoundItemRequestError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'No se pudo registrar tu reporte. Intenta nuevamente.' });
    }
  });

  return router;
}