import { createMatchesService } from './matchesService';

describe('Servicio para publicar objetos encontrados', () => {
  it('envia la visibilidad elegida y la conserva en el resultado', async () => {
    const apiFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ code: 'HZ-0004', matchCount: 2, visibility: 'HIDDEN' }),
    });

    await expect(createMatchesService(apiFetch).publish('HZ-0004', 'HIDDEN')).resolves.toEqual({
      status: 'PUBLISHED',
      matchCount: 2,
      visibility: 'HIDDEN',
    });
    expect(apiFetch).toHaveBeenCalledWith('/found-items/HZ-0004/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: 'HIDDEN' }),
    });
  });
});
