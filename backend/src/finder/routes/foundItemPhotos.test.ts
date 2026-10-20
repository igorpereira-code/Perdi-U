import request from 'supertest';
import { createApp } from '../../app';
import { SAMPLE_USERS } from '../../core/sampleUsers';
import type { FoundItemPhotoStorage } from '../data/foundItemPhotoStorage';
import type { FoundItemPhotoAccess, FoundItemsRepository } from '../data/foundItemsRepository';

// Imagen mínima de prueba. No se accede a Storage ni a la base de datos reales.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
const report = { description: 'Llaves azules', categoryId: 47, placeId: 83, foundAt: '2026-10-19T04:00:00.000Z' };
const path = `${SAMPLE_USERS.ana.id}/6bcb919c-e40f-4f64-85b4-d21dfafc7844.png`;
const created = { code: 'HZ-7325', status: 'PENDING_DROP_OFF' };

function setup() {
  const foundItems: jest.Mocked<FoundItemsRepository> = {
    listMine: jest.fn().mockResolvedValue([]),
    getMineByCode: jest.fn().mockResolvedValue(null),
    getCatalogs: jest.fn().mockResolvedValue({
      categories: [{ id: 47, name: 'Llaves' }],
      places: [{ id: 83, name: 'Biblioteca', type: 'SPACE', classrooms: [] }],
    }),
    create: jest.fn().mockResolvedValue(created),
    getPhotoByCode: jest.fn().mockResolvedValue({
      finderId: SAMPLE_USERS.ana.id, photoUrl: path, status: 'PENDING_DROP_OFF', visibility: 'VISIBLE',
    }),
  };
  const photos: jest.Mocked<FoundItemPhotoStorage> = {
    upload: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    createSignedUrl: jest.fn().mockResolvedValue('https://storage.example/foto-firmada'),
  };
  return { foundItems, photos, app: createApp({ foundItems, foundItemPhotos: photos }) };
}

describe('Fotografía opcional en el registro del reporte', () => {
  it('exige autenticación antes de subir fotografías', async () => {
    const { foundItems, photos } = setup();
    const res = await request(createApp({ foundItems, foundItemPhotos: photos, allowSampleUsers: false }))
      .post('/found-items').field('report', JSON.stringify(report))
      .attach('photo', png, { filename: 'foto.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
    expect(photos.upload).not.toHaveBeenCalled();
    expect(foundItems.create).not.toHaveBeenCalled();
  });

  it('sube la foto desde el servidor y guarda su ruta antes de devolver el HZ- de Prisma', async () => {
    const { app, foundItems, photos } = setup();
    const res = await request(app).post('/found-items').field('report', JSON.stringify(report))
      .attach('photo', png, { filename: '../nombre-del-cliente.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
    expect(photos.upload).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^${SAMPLE_USERS.ana.id}/[a-f0-9-]{36}\\.png$`)), png, 'image/png',
    );
    expect(foundItems.create).toHaveBeenCalledWith(expect.objectContaining({
      finderId: SAMPLE_USERS.ana.id, photoUrl: photos.upload.mock.calls[0][0],
    }));
    expect(photos.upload.mock.invocationCallOrder[0]).toBeLessThan(foundItems.create.mock.invocationCallOrder[0]);
    expect(photos.remove).not.toHaveBeenCalled();
    expect(photos.createSignedUrl).not.toHaveBeenCalled();
  });

  it('mantiene el registro sin fotografía y no necesita el cliente de Storage', async () => {
    const { app, foundItems, photos } = setup();
    const res = await request(app).post('/found-items').send(report);

    expect(res.status).toBe(201);
    expect(photos.upload).not.toHaveBeenCalled();
    expect(foundItems.create.mock.calls[0][0]).not.toHaveProperty('photoUrl');
  });

  it.each([
    ['SVG', Buffer.from('<svg/>'), 'image/svg+xml', 415],
    ['tipo falseado', png, 'image/jpeg', 415],
    ['archivo vacío', Buffer.alloc(0), 'image/png', 400],
    ['archivo mayor a 5 MiB', Buffer.alloc(5 * 1024 * 1024 + 1, 1), 'image/png', 413],
  ])('rechaza %s sin subir ni guardar', async (_name, bytes, contentType, expectedStatus) => {
    const { app, foundItems, photos } = setup();
    const res = await request(app).post('/found-items').field('report', JSON.stringify(report))
      .attach('photo', bytes, { filename: 'foto.png', contentType });

    expect(res.status).toBe(expectedStatus);
    expect(res.body.error).toEqual(expect.any(String));
    expect(photos.upload).not.toHaveBeenCalled();
    expect(foundItems.create).not.toHaveBeenCalled();
  });

  it('no sube la foto si los campos del reporte son inválidos', async () => {
    const { app, foundItems, photos } = setup();
    const res = await request(app).post('/found-items')
      .field('report', JSON.stringify({ ...report, description: '' }))
      .attach('photo', png, { filename: 'foto.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(photos.upload).not.toHaveBeenCalled();
    expect(foundItems.create).not.toHaveBeenCalled();
  });

  it.each([
    [Buffer.from([255, 216, 255, 224, 0, 2, 255, 217]), 'image/jpeg', 'jpg'],
    [Buffer.from('RIFF0000WEBP0000'), 'image/webp', 'webp'],
  ])('reconoce el formato binario y usa su extensión, independientemente del nombre: %s', async (bytes, contentType, extension) => {
    const { app, photos } = setup();
    const res = await request(app).post('/found-items').field('report', JSON.stringify(report))
      .attach('photo', bytes, { filename: 'nombre.png', contentType });

    expect(res.status).toBe(201);
    expect(photos.upload).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`\\.${extension}$`)), bytes, contentType);
  });

  it('limita el cuerpo completo antes de analizar multipart', async () => {
    const { app, foundItems, photos } = setup();
    const res = await request(app).post('/found-items').field('report', JSON.stringify(report))
      .attach('photo', Buffer.alloc(6 * 1024 * 1024 + 1, 1), { filename: 'grande.png', contentType: 'image/png' });

    expect(res.status).toBe(413);
    expect(res.body.error).toEqual(expect.any(String));
    expect(photos.upload).not.toHaveBeenCalled();
    expect(foundItems.create).not.toHaveBeenCalled();
  });

  it('rechaza referencias de fotografías proporcionadas por el cliente incluso con un archivo adjunto', async () => {
    const { app, foundItems, photos } = setup();
    const res = await request(app).post('/found-items')
      .field('report', JSON.stringify({ ...report, photoUrl: 'otra-persona/foto.png' }))
      .attach('photo', png, { filename: 'foto.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(photos.upload).not.toHaveBeenCalled();
    expect(foundItems.create).not.toHaveBeenCalled();
  });

  it('rechaza más de una fotografía', async () => {
    const { app, foundItems, photos } = setup();
    const res = await request(app).post('/found-items').field('report', JSON.stringify(report))
      .attach('photo', png, { filename: 'primera.png', contentType: 'image/png' })
      .attach('photo', png, { filename: 'segunda.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(photos.upload).not.toHaveBeenCalled();
    expect(foundItems.create).not.toHaveBeenCalled();
  });

  it('controla un formulario multipart mal formado', async () => {
    const { app, photos } = setup();
    const res = await request(app).post('/found-items')
      .set('Content-Type', 'multipart/form-data; boundary=inexistente').send('incompleto');

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
    expect(photos.upload).not.toHaveBeenCalled();
  });

  it('no crea el reporte cuando Storage rechaza la subida', async () => {
    const { app, foundItems, photos } = setup();
    photos.upload.mockRejectedValue(new Error('Detalle interno de Storage'));
    const res = await request(app).post('/found-items').field('report', JSON.stringify(report))
      .attach('photo', png, { filename: 'foto.png', contentType: 'image/png' });

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'No se pudo subir la fotografía. Intenta nuevamente.' });
    expect(foundItems.create).not.toHaveBeenCalled();
    expect(photos.remove).not.toHaveBeenCalled();
  });

  it('elimina la fotografía recién subida si Prisma no guarda el reporte', async () => {
    const { app, foundItems, photos } = setup();
    foundItems.create.mockRejectedValue(new Error('Detalle interno de Prisma'));
    const res = await request(app).post('/found-items').field('report', JSON.stringify(report))
      .attach('photo', png, { filename: 'foto.png', contentType: 'image/png' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'No se pudo registrar el objeto encontrado. Intenta nuevamente.' });
    expect(photos.remove).toHaveBeenCalledWith(photos.upload.mock.calls[0][0]);
    expect(res.body).not.toHaveProperty('code');
  });

  it('conserva un error controlado si también falla la limpieza del archivo', async () => {
    const { app, foundItems, photos } = setup();
    foundItems.create.mockRejectedValue(new Error('Error de guardado'));
    photos.remove.mockRejectedValue(new Error('Error de limpieza'));
    const res = await request(app).post('/found-items').field('report', JSON.stringify(report))
      .attach('photo', png, { filename: 'foto.png', contentType: 'image/png' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'No se pudo registrar el objeto encontrado. Intenta nuevamente.' });
    expect(photos.remove).toHaveBeenCalledTimes(1);
  });
});

describe('Consulta autorizada de fotografías (GET /found-items/:code/photo)', () => {
  const states: FoundItemPhotoAccess['status'][] = ['PENDING_DROP_OFF', 'IN_CUSTODY', 'PUBLISHED', 'DELIVERED'];
  const visibility: FoundItemPhotoAccess['visibility'][] = ['VISIBLE', 'HIDDEN'];
  for (const status of states) {
    for (const visible of visibility) {
      it.each(['ana', 'welfare', 'luis'] as const)(`comprueba acceso de %s con estado ${status} y visibilidad ${visible}`, async (user) => {
        const { app, foundItems, photos } = setup();
        foundItems.getPhotoByCode.mockResolvedValue({ finderId: SAMPLE_USERS.ana.id, photoUrl: path, status, visibility: visible });
        const allowed = user !== 'luis' || (visible === 'VISIBLE' && status !== 'PENDING_DROP_OFF');

        const res = await request(app).get('/found-items/HZ-7325/photo').set('x-sample-user', user);

        expect(res.status).toBe(allowed ? 200 : 403);
        if (allowed) {
          expect(res.body).toEqual({ url: 'https://storage.example/foto-firmada', expiresIn: 60 });
          expect(res.headers['cache-control']).toBe('private, no-store');
          expect(photos.createSignedUrl).toHaveBeenCalledWith(path, 60);
        } else {
          expect(photos.createSignedUrl).not.toHaveBeenCalled();
          expect(res.body).not.toHaveProperty('url');
        }
      });
    }
  }

  it('rechaza consultas sin sesión antes de buscar el reporte', async () => {
    const { foundItems, photos } = setup();
    const res = await request(createApp({ foundItems, foundItemPhotos: photos, allowSampleUsers: false }))
      .get('/found-items/HZ-7325/photo');

    expect(res.status).toBe(401);
    expect(foundItems.getPhotoByCode).not.toHaveBeenCalled();
    expect(photos.createSignedUrl).not.toHaveBeenCalled();
  });

  it.each([null, { finderId: SAMPLE_USERS.ana.id, photoUrl: null, status: 'PENDING_DROP_OFF', visibility: 'VISIBLE' }] as const)
    ('responde que no hay fotografía cuando falta el reporte o el archivo', async (item) => {
      const { app, foundItems, photos } = setup();
      foundItems.getPhotoByCode.mockResolvedValue(item);
      const res = await request(app).get('/found-items/HZ-7325/photo');

      expect(res.status).toBe(404);
      expect(photos.createSignedUrl).not.toHaveBeenCalled();
    });

  it('controla errores al firmar sin exponer información interna', async () => {
    const { app, photos } = setup();
    photos.createSignedUrl.mockRejectedValue(new Error('Detalle interno de Storage'));
    const res = await request(app).get('/found-items/HZ-7325/photo');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'No se pudo consultar la fotografía. Intenta nuevamente.' });
    expect(res.body).not.toHaveProperty('url');
  });

  it.each(['blob:archivo-local', 'https://storage.example/firma-temporal', '../otra-carpeta/foto.png'])
    ('no firma una URL o una ruta inválida que aparezca en los datos: %s', async (photoUrl) => {
      const { app, foundItems, photos } = setup();
      foundItems.getPhotoByCode.mockResolvedValue({ finderId: SAMPLE_USERS.ana.id, photoUrl, status: 'PENDING_DROP_OFF', visibility: 'VISIBLE' });
      const res = await request(app).get('/found-items/HZ-7325/photo');

      expect(res.status).toBe(404);
      expect(photos.createSignedUrl).not.toHaveBeenCalled();
    });
});
