import { createFoundItemsService, type FoundItemPayload } from './foundItemsService';

const report: FoundItemPayload = {
  description: 'Llaves azules', categoryId: 47, placeId: 83,
  classroomId: null, placeReference: null, foundAt: '2026-10-19T04:00:00.000Z',
};
const created = { code: 'HZ-7325', status: 'PENDING_DROP_OFF' };
const response = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const listedReport = { code: 'HZ-7325', description: 'Llaves', category: 'Llaves',
  foundAt: '2026-10-18T12:15:00.000Z', hasPhoto: false, status: 'PENDING_DROP_OFF', receivedAt: null };

describe('Servicio de reportes encontrados', () => {
  it('recupera un detalle propio mediante apiFetch y conserva el código persistido', async () => {
    const apiFetch = jest.fn().mockResolvedValue(response(listedReport));

    await expect(createFoundItemsService(apiFetch).getMineByCode(listedReport.code)).resolves.toEqual(listedReport);
    expect(apiFetch).toHaveBeenCalledWith('/my-found-items/HZ-7325');
  });

  it('devuelve null cuando el backend indica que el detalle no existe o no pertenece al usuario', async () => {
    const apiFetch = jest.fn().mockResolvedValue(response({ error: 'No encontramos este reporte.' }, 404));

    await expect(createFoundItemsService(apiFetch).getMineByCode(listedReport.code)).resolves.toBeNull();
  });

  it.each([
    ['servidor', async () => response({}, 503)],
    ['red', async () => { throw new TypeError('Failed to fetch'); }],
    ['JSON inválido', async () => ({ ok: true, status: 200, json: async () => { throw new Error('JSON inválido'); } })],
    ['datos incompletos', async () => response({ code: listedReport.code })],
    ['código distinto del solicitado', async () => response({ ...listedReport, code: 'HZ-9999' })],
  ])('controla el error de %s al consultar un detalle', async (_name, fetchResult) => {
    const apiFetch = jest.fn().mockImplementation(fetchResult);

    await expect(createFoundItemsService(apiFetch).getMineByCode(listedReport.code))
      .rejects.toThrow('No se pudo cargar el reporte. Intenta nuevamente.');
  });

  it('consulta mis reportes mediante apiFetch sin enviar un identificador de hallador', async () => {
    const reports = [{ code: 'HZ-7325', description: 'Llaves azules', category: 'Llaves',
      foundAt: '2026-10-18T12:15:00.000Z', hasPhoto: true, status: 'PENDING_DROP_OFF', receivedAt: null }];
    const apiFetch = jest.fn().mockResolvedValue(response(reports));

    await expect(createFoundItemsService(apiFetch).listMine()).resolves.toEqual(reports);
    expect(apiFetch).toHaveBeenCalledWith('/my-found-items');
  });

  it.each([
    { status: 'IN_CUSTODY', receivedAt: '2026-10-19T14:30:00.000Z' },
    { status: 'PUBLISHED', receivedAt: null },
    { status: 'DELIVERED', receivedAt: '2026-10-19T14:30:00.000Z' },
  ])('conserva el estado y la fecha de recepción entregados por el backend: %j', async (reception) => {
    const reports = [{ code: 'HZ-7325', description: 'Llaves', category: 'Llaves',
      foundAt: '2026-10-18T12:15:00.000Z', hasPhoto: false, ...reception }];
    const apiFetch = jest.fn().mockResolvedValue(response(reports));

    await expect(createFoundItemsService(apiFetch).listMine()).resolves.toEqual(reports);
  });

  it.each([
    { status: 'ARCHIVED', receivedAt: null },
    { status: 'IN_CUSTODY', receivedAt: 'ayer' },
    { status: 'IN_CUSTODY', receivedAt: undefined },
  ])('rechaza datos de recepción inválidos: %j', async (reception) => {
    const reports = [{ code: 'HZ-7325', description: 'Llaves', category: 'Llaves',
      foundAt: '2026-10-18T12:15:00.000Z', hasPhoto: false, ...reception }];
    const apiFetch = jest.fn().mockResolvedValue(response(reports));

    await expect(createFoundItemsService(apiFetch).listMine())
      .rejects.toThrow('No se pudieron cargar tus reportes. Intenta nuevamente.');
  });

  it.each([
    null,
    { ...listedReport, code: 'PR-0001' },
    { ...listedReport, foundAt: 'ayer' },
    { ...listedReport, hasPhoto: undefined, photoUrl: 'privado/foto.png' },
  ])('rechaza un reporte incompleto o inválido sin utilizar rutas de Storage: %j', async (invalid) => {
    const apiFetch = jest.fn().mockResolvedValue(response([invalid]));

    await expect(createFoundItemsService(apiFetch).listMine())
      .rejects.toThrow('No se pudieron cargar tus reportes. Intenta nuevamente.');
  });

  it.each([
    { url: 'usuario/foto.png', expiresIn: 60 },
    { url: 'data:image/png;base64,imagen', expiresIn: 60 },
    { url: 'https://storage.example/foto-firmada', expiresIn: 0 },
  ])('rechaza una respuesta de fotografía sin URL temporal válida: %j', async (invalid) => {
    const apiFetch = jest.fn().mockResolvedValue(response(invalid));

    await expect(createFoundItemsService(apiFetch).getPhotoUrl('HZ-7325'))
      .rejects.toThrow('No se pudo consultar la fotografía. Intenta nuevamente.');
  });

  it.each([
    ['red', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['servidor', async () => response({}, 503)],
    ['respuesta inválida', async () => response({})],
  ])('informa el error de %s al consultar mis reportes', async (_name, fetchResult) => {
    await expect(createFoundItemsService(jest.fn().mockImplementation(fetchResult)).listMine())
      .rejects.toThrow('No se pudieron cargar tus reportes. Intenta nuevamente.');
  });

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
