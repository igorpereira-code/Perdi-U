import type { MatchView } from '@shared/matching';
import { createMatchesService } from './matchesService';

const phone: MatchView = {
  id: 'match-1',
  status: 'SUGGESTED',
  similarity: 100,
  foundItem: {
    code: 'HZ-0001',
    description: 'Celular Samsung con funda azul',
    photoUrl: null,
    category: 'Electrónicos',
  },
};

describe('Traer los objetos parecidos a un reporte', () => {
  it('pide al backend los objetos parecidos al reporte', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [phone] });
    const service = createMatchesService(apiFetch);

    await expect(service.getMatches('PR-0001')).resolves.toEqual([phone]);
    expect(apiFetch).toHaveBeenCalledWith('/lost-reports/PR-0001/matches');
  });

  it('avisa que no encontró el reporte cuando no existe o es de otra persona', async () => {
    const apiFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Lost report not found' }),
    });
    const service = createMatchesService(apiFetch);

    await expect(service.getMatches('PR-0002')).resolves.toBeNull();
  });

  it('avisa al backend que el dueño pasará a recoger el objeto', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ok: true });
    const service = createMatchesService(apiFetch);

    await service.pickUp('match-1');

    expect(apiFetch).toHaveBeenCalledWith('/matches/match-1/pick-up', { method: 'POST' });
  });

  it('avisa al backend que el objeto no es del dueño', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ok: true });
    const service = createMatchesService(apiFetch);

    await service.dismiss('match-1');

    expect(apiFetch).toHaveBeenCalledWith('/matches/match-1/dismiss', { method: 'POST' });
  });

  it('avisa que no se puede publicar un objeto que Bienestar todavía no recibió', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 409, json: async () => ({ code: 'NOT_RECEIVED' }) });
    const service = createMatchesService(apiFetch);

    await expect(service.publish('HZ-0005')).resolves.toEqual({ status: 'NOT_RECEIVED' });
    expect(apiFetch).toHaveBeenCalledWith('/found-items/HZ-0005/publish', { method: 'POST' });
  });

  it('trae cuántos reportes de pérdida se parecen al objeto publicado', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ code: 'HZ-0004', matchCount: 2 }),
      });
    const service = createMatchesService(apiFetch);

    await expect(service.publish('HZ-0004')).resolves.toEqual({
      status: 'PUBLISHED',
      matchCount: 2,
    });
  });
});
