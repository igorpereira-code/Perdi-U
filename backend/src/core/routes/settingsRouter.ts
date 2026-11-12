import { Router, type RequestHandler } from 'express';
import { requireRole } from '../currentUser';
import type { SettingsRepository } from '../data/settingsRepository';
import { readWelfareOffice } from '../logic/readWelfareOffice';

export function createSettingsRouter(settings: SettingsRepository): Router {
  const router = Router();

  const getWelfareOffice: RequestHandler = async (_req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      res.json(await settings.getWelfareOffice());
    } catch {
      res.status(503).json({
        error: 'No se pudo cargar la ubicación de Bienestar. Intenta nuevamente.',
      });
    }
  };

  const updateWelfareOffice: RequestHandler = async (req, res) => {
    const result = readWelfareOffice(req.body);
    if ('error' in result) {
      res.status(400).json({ error: result.error });
      return;
    }
    try {
      res.json(await settings.updateWelfareOffice(result.welfareOffice));
    } catch {
      res.status(503).json({
        error: 'No se pudo guardar la ubicación de Bienestar. Intenta nuevamente.',
      });
    }
  };

  router.get('/welfare-office', getWelfareOffice);
  router.put('/admin/welfare-office', requireRole('ADMIN'), updateWelfareOffice);

  return router;
}
