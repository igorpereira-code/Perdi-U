import { createGuideService } from './guideService';

describe('Guardar la decisión de la guía rápida', () => {
  it('usa la API autenticada sin enviar un identificador de usuario', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ok: true });

    await createGuideService(apiFetch).markSeen();

    expect(apiFetch).toHaveBeenCalledWith('/me/guide-seen', { method: 'POST' });
  });

  it('rechaza el guardado si el servidor responde con un error', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(createGuideService(apiFetch).markSeen()).rejects.toThrow(
      'No pudimos guardar tu decisión. Inténtalo de nuevo.',
    );
  });

  it('propaga un error de conexión para que la pantalla pueda informarlo', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Sin conexión'));

    await expect(createGuideService(apiFetch).markSeen()).rejects.toThrow('Sin conexión');
  });
});
