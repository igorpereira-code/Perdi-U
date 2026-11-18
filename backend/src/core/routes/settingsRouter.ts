import { Router, type RequestHandler } from 'express';
import { requireRole } from '../currentUser';
import type { SettingsRepository } from '../data/settingsRepository';
import { readWelfareOffice } from '../logic/readWelfareOffice';
import { readMatchSettings } from '../logic/readMatchSettings';

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

  const getMatchSettings: RequestHandler = async (_req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      res.json(await settings.getMatchSettings());
    } catch {
      res.status(503).json({ error: 'No se pudo cargar el nivel mínimo. Intenta nuevamente.' });
    }
  };

  const updateMatchSettings: RequestHandler = async (req, res) => {
    const result = readMatchSettings(req.body);
    if ('error' in result) {
      res.status(400).json({ error: result.error });
      return;
    }
    try {
      res.json(await settings.updateMatchSettings(result.matchSettings));
    } catch {
      res.status(503).json({ error: 'No se pudo guardar el nivel mínimo. Intenta nuevamente.' });
    }
  };
  router.get('/welfare-office', getWelfareOffice);
  router.put('/admin/welfare-office', requireRole('ADMIN'), updateWelfareOffice);
  router.get('/admin/match-settings', requireRole('ADMIN'), getMatchSettings);
  router.put('/admin/match-settings', requireRole('ADMIN'), updateMatchSettings);

  return router;
}
