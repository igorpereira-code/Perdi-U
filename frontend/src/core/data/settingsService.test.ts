import type { ApiFetch } from './api';
import { createSettingsService } from './settingsService';

const welfareOffice = { place: 'Bienestar Estudiantil – Bloque D', hours: '08:00 a 17:00' };

function createResponse(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('Ubicación y horario de Bienestar', () => {
  it('trae la ubicación y el horario del backend', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(200, welfareOffice));

    await expect(createSettingsService(apiFetch as ApiFetch).getWelfareOffice()).resolves.toEqual(
      welfareOffice,
    );
    expect(apiFetch).toHaveBeenCalledWith('/welfare-office');
  });

  it('avisa con un mensaje claro si no se pudieron cargar', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(503, null));

    await expect(createSettingsService(apiFetch as ApiFetch).getWelfareOffice()).rejects.toThrow(
      'No se pudo cargar la ubicación de Bienestar. Intenta nuevamente.',
    );
  });

  it('guarda la nueva ubicación y el nuevo horario', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(200, welfareOffice));

    await expect(
      createSettingsService(apiFetch as ApiFetch).updateWelfareOffice(welfareOffice),
    ).resolves.toEqual(welfareOffice);
    expect(apiFetch).toHaveBeenCalledWith('/admin/welfare-office', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(welfareOffice),
    });
  });

  it('muestra el motivo que da el backend si no se pudo guardar', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValue(createResponse(400, { error: 'Escribe el horario.' }));

    await expect(
      createSettingsService(apiFetch as ApiFetch).updateWelfareOffice(welfareOffice),
    ).rejects.toThrow('Escribe el horario.');
  });

  it('si el backend no da un motivo, usa un mensaje claro', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(500, null));

    await expect(
      createSettingsService(apiFetch as ApiFetch).updateWelfareOffice(welfareOffice),
    ).rejects.toThrow('No se pudo guardar la ubicación de Bienestar. Intenta nuevamente.');
  });
});

describe('Nivel mínimo de similitud', () => {
  it('trae el nivel mínimo del backend', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(200, { minSimilarity: 40 }));

    await expect(createSettingsService(apiFetch as ApiFetch).getMatchSettings()).resolves.toEqual({
      minSimilarity: 40,
    });
    expect(apiFetch).toHaveBeenCalledWith('/admin/match-settings');
  });

  it('avisa con un mensaje claro si no se pudo cargar', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(503, null));

    await expect(createSettingsService(apiFetch as ApiFetch).getMatchSettings()).rejects.toThrow(
      'No se pudo cargar el nivel mínimo. Intenta nuevamente.',
    );
  });

  it('guarda el nuevo nivel mínimo', async () => {
    const apiFetch = jest.fn().mockResolvedValue(createResponse(200, { minSimilarity: 60 }));

    await expect(
      createSettingsService(apiFetch as ApiFetch).updateMatchSettings({ minSimilarity: 60 }),
    ).resolves.toEqual({ minSimilarity: 60 });
    expect(apiFetch).toHaveBeenCalledWith('/admin/match-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minSimilarity: 60 }),
    });
  });

  it('muestra el motivo que da el backend si no se pudo guardar', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValue(
        createResponse(400, { error: 'El nivel mínimo debe ser un número entero entre 0 y 100.' }),
      );

    await expect(
      createSettingsService(apiFetch as ApiFetch).updateMatchSettings({ minSimilarity: 150 }),
    ).rejects.toThrow('El nivel mínimo debe ser un número entero entre 0 y 100.');
  });
});
