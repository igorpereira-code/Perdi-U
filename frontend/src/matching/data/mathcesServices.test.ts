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
    const apiFetch = jest
      .fn()
      .mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Lost report not found' }),
      });
    const service = createMatchesService(apiFetch);

    await expect(service.getMatches('PR-0002')).resolves.toBeNull();
  });
});
