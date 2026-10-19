import type {
  WelfareFoundItemView,
  WelfareLostReportView,
  WelfarePendingPickupView,
} from '@shared/welfare';
import { createWelfareService } from './welfareService';

const item: WelfareFoundItemView = {
  code: 'HZ-0005', description: 'Mochila negra', photoUrl: null, category: 'Mochilas',
  place: 'Bloque A', classroom: null, placeReference: null,
  foundAt: '2026-10-15T14:00:00.000Z', status: 'PENDING_DROP_OFF',
  finder: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
};

describe('Servicio de recepcion de Bienestar', () => {
  it('trae los reportes de perdida activos', async () => {
    const report: WelfareLostReportView = {
      code: 'PR-0001',
      description: 'Celular Samsung con funda azul',
      photoUrl: null,
      category: 'Electrónicos',
      dateFrom: '2026-10-10T00:00:00.000Z',
      dateTo: '2026-10-11T00:00:00.000Z',
      status: 'HAS_MATCHES',
      owner: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
    };
    const apiFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [report] });

    await expect(createWelfareService(apiFetch).listActiveLostReports()).resolves.toEqual([report]);
    expect(apiFetch).toHaveBeenCalledWith('/welfare/lost-reports');
  });

  it('registra una entrega con los datos del receptor y reporte opcional', async () => {
    const apiFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'DELIVERED', foundItemCode: 'HZ-0003' }),
    });
    const delivery = {
      foundItemCode: ' hz-0003 ',
      lostReportCode: ' pr-0001 ',
      recipientName: 'Ana Rojas',
      recipientEmail: 'ANA.ROJAS@UCB.EDU.BO',
      recipientUniversityCode: '20205678',
    };

    await expect(createWelfareService(apiFetch).deliver(delivery)).resolves.toEqual({
      status: 'DELIVERED',
      foundItemCode: 'HZ-0003',
    });
    expect(apiFetch).toHaveBeenCalledWith('/welfare/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...delivery,
        foundItemCode: 'HZ-0003',
        lostReportCode: 'PR-0001',
        recipientEmail: 'ana.rojas@ucb.edu.bo',
      }),
    });
  });

  it('trae los recojos pendientes', async () => {
    const pickup: WelfarePendingPickupView = {
      matchId: 'match-1',
      owner: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
      report: { code: 'PR-0001' },
      foundItem: { code: 'HZ-0001', description: 'Celular Samsung con funda azul' },
    };
    const apiFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [pickup] });

    await expect(createWelfareService(apiFetch).listPendingPickups()).resolves.toEqual([pickup]);
    expect(apiFetch).toHaveBeenCalledWith('/welfare/pending-pickups');
  });

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
