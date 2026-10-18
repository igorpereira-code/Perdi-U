import type { WelfareFoundItemView } from '@shared/welfare';
import { createWelfareService } from './welfareService';

const item: WelfareFoundItemView = {
  code: 'HZ-0005', description: 'Mochila negra', photoUrl: null, category: 'Mochilas',
  place: 'Bloque A', classroom: null, placeReference: null,
  foundAt: '2026-10-15T14:00:00.000Z', status: 'PENDING_DROP_OFF',
  finder: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
};

describe('Servicio de recepcion de Bienestar', () => {
  it('trae los objetos que siguen en la oficina', async () => {
    const inOffice = { ...item, status: 'IN_CUSTODY' as const };
    const apiFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [inOffice] });
    const welfareService = createWelfareService(apiFetch);

    const result = welfareService.listInOffice();

    expect(result).toBeDefined();
    await expect(result).resolves.toEqual([inOffice]);
    expect(apiFetch).toHaveBeenCalledWith('/welfare/found-items/in-office');
  });

  it('trae los objetos pendientes', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [item] });
    await expect(createWelfareService(apiFetch).listPending()).resolves.toEqual([item]);
    expect(apiFetch).toHaveBeenCalledWith('/welfare/found-items/pending');
  });

  it('busca con el codigo normalizado', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => item });
    await expect(createWelfareService(apiFetch).findByCode(' hz-0005 ')).resolves.toEqual({ status: 'FOUND', item });
    expect(apiFetch).toHaveBeenCalledWith('/welfare/found-items/HZ-0005');
  });

  it.each([[404, 'NOT_FOUND'], [409, 'ALREADY_RECEIVED']] as const)(
    'traduce el estado HTTP %s a %s', async (httpStatus, status) => {
      const apiFetch = jest.fn().mockResolvedValue({ ok: false, status: httpStatus });
      await expect(createWelfareService(apiFetch).findByCode('HZ-0005')).resolves.toEqual({ status });
    },
  );

  it('confirma la recepcion y devuelve el objeto actualizado', async () => {
    const received = { ...item, status: 'IN_CUSTODY' as const };
    const apiFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => received });
    await expect(createWelfareService(apiFetch).receive(' hz-0005 ')).resolves.toEqual({ status: 'FOUND', item: received });
    expect(apiFetch).toHaveBeenCalledWith('/welfare/found-items/HZ-0005/receive', { method: 'POST' });
  });

  it('rechaza errores inesperados del servidor', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(createWelfareService(apiFetch).listPending()).rejects.toThrow('No se pudo consultar Bienestar');
  });
});
