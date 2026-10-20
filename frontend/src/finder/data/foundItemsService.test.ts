import { createFoundItemsService, type FoundItemPayload } from './foundItemsService';

const report: FoundItemPayload = {
  description: 'Llaves azules', categoryId: 47, placeId: 83,
  classroomId: null, placeReference: null, foundAt: '2026-10-19T04:00:00.000Z',
};
const created = { code: 'HZ-7325', status: 'PENDING_DROP_OFF' };
const response = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

describe('Servicio de reportes encontrados', () => {
  it('obtiene los catálogos mediante apiFetch sin usar copias locales', async () => {
    const catalogs = { categories: [{ id: 47, name: 'Llaves' }], places: [] };
    const apiFetch = jest.fn().mockResolvedValue(response(catalogs));

    await expect(createFoundItemsService(apiFetch).getCatalogs()).resolves.toEqual(catalogs);
    expect(apiFetch).toHaveBeenCalledWith('/found-items/catalogs');
  });

  it('envía un reporte sin fotografía como JSON y conserva el código del backend', async () => {
    const apiFetch = jest.fn().mockResolvedValue(response(created, 201));

    await expect(createFoundItemsService(apiFetch).create(report, null)).resolves.toEqual(created);
    expect(apiFetch).toHaveBeenCalledWith('/found-items', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report),
    });
  });

  it('envía la foto al backend como multipart sin proponer una ruta ni subir a Supabase', async () => {
    const apiFetch = jest.fn().mockResolvedValue(response(created, 201));
    const photo = new File(['imagen'], 'llaves.png', { type: 'image/png' });

    await expect(createFoundItemsService(apiFetch).create(report, photo)).resolves.toEqual(created);
    const [path, init] = apiFetch.mock.calls[0];
    expect(path).toBe('/found-items');
    expect(init.method).toBe('POST');
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);
    expect(JSON.parse(init.body.get('report'))).toEqual(report);
    expect(init.body.get('photo')).toBe(photo);
  });

  it('solicita al backend una URL temporal por código, sin firmarla en el navegador', async () => {
    const result = { url: 'https://storage.example/foto-firmada', expiresIn: 60 };
    const apiFetch = jest.fn().mockResolvedValue(response(result));

    await expect(createFoundItemsService(apiFetch).getPhotoUrl('HZ-7325')).resolves.toEqual(result);
    expect(apiFetch).toHaveBeenCalledWith('/found-items/HZ-7325/photo');
  });

  it.each([400, 413, 415, 500, 503])('muestra el error de backend con estado %s sin devolver un código', async (status) => {
    const apiFetch = jest.fn().mockResolvedValue(response({ error: 'No se pudo guardar el reporte.' }, status));

    await expect(createFoundItemsService(apiFetch).create(report, null))
      .rejects.toThrow('No se pudo guardar el reporte.');
  });

  it('muestra un error en español si falla la red', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(createFoundItemsService(apiFetch).create(report, null))
      .rejects.toThrow('No se pudo enviar el reporte. Intenta nuevamente.');
  });

  it('no considera creado un reporte sin código válido o sin respuesta 201', async () => {
    const apiFetch = jest.fn().mockResolvedValue(response({ status: 'PENDING_DROP_OFF' }, 201));

    await expect(createFoundItemsService(apiFetch).create(report, null))
      .rejects.toThrow('No se pudo confirmar el código del reporte.');
  });
});
