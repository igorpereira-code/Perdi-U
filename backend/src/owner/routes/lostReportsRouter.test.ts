import request from 'supertest';
import { createApp } from '../../app';
import { SAMPLE_USERS } from '../../core/sampleUsers';
import type { FoundItemCatalogs, FoundItemsRepository } from '../../finder/data/foundItemsRepository';
import type { FoundItemPhotoStorage } from '../../finder/data/foundItemPhotoStorage';
import type { LostReportsRepository } from '../data/lostReportsRepository';

// Datos simulados: ninguna prueba consulta ni escribe en Supabase.
const catalogs: FoundItemCatalogs = {
  categories: [{ id: 47, name: 'Llaves' }],
  places: [
    { id: 83, name: 'Bloque A', type: 'BLOCK', classrooms: [{ id: 216, name: 'Aula A-12' }] },
    { id: 98, name: 'Biblioteca', type: 'SPACE', classrooms: [] },
  ],
};
const validReport = {
  description: 'Llaves con llavero azul',
  categoryId: 47,
  places: [
    { placeId: 83, classroomId: 216 },
    { placeId: 98, classroomId: null },
  ],
  placeDescription: 'Fui de la biblioteca al bloque A',
  dateFrom: '2026-10-17',
  dateTo: '2026-10-18',
};

function fakes() {
  const lostReports: jest.Mocked<LostReportsRepository> = {
    create: jest.fn().mockResolvedValue({ code: 'PR-0007', status: 'SEARCHING' }),
  };
  const foundItems = { getCatalogs: jest.fn().mockResolvedValue(catalogs) } as unknown as FoundItemsRepository;
  const foundItemPhotos: jest.Mocked<FoundItemPhotoStorage> = {
    upload: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    createSignedUrl: jest.fn(),
  };
  return { lostReports, foundItems, foundItemPhotos };
}

describe('Recibir un código al enviar el reporte de pérdida (POST /lost-reports)', () => {
  it('guarda el reporte a nombre de quien inició sesión y devuelve su código', async () => {
    const { lostReports, foundItems, foundItemPhotos } = fakes();

    const res = await request(createApp({ lostReports, foundItems, foundItemPhotos }))
      .post('/lost-reports')
      .send(validReport);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ code: 'PR-0007', status: 'SEARCHING' });
    expect(lostReports.create).toHaveBeenCalledWith({
      description: 'Llaves con llavero azul',
      categoryId: 47,
      places: [
        { placeId: 83, classroomId: 216 },
        { placeId: 98, classroomId: null },
      ],
      placeDescription: 'Fui de la biblioteca al bloque A',
      dateFrom: new Date('2026-10-17T00:00:00.000Z'),
      dateTo: new Date('2026-10-18T00:00:00.000Z'),
      ownerId: SAMPLE_USERS.ana.id,
    });
  });

  it('permite enviar el reporte sin lugares ni descripción del lugar', async () => {
    const { lostReports, foundItems, foundItemPhotos } = fakes();
    const { places: _places, placeDescription: _text, ...required } = validReport;

    const res = await request(createApp({ lostReports, foundItems, foundItemPhotos }))
      .post('/lost-reports')
      .send(required);

    expect(res.status).toBe(201);
    expect(lostReports.create).toHaveBeenCalledWith(
      expect.objectContaining({ places: [], placeDescription: null }),
    );
  });

  it.each([
    ['sin descripción', 'description', '   '],
    ['sin categoría', 'categoryId', undefined],
    ['con una categoría que no existe', 'categoryId', 999],
    ['sin fecha inicial', 'dateFrom', undefined],
    ['sin fecha final', 'dateTo', ''],
    ['con una fecha imposible', 'dateFrom', '2026-02-30'],
    ['con la fecha final antes de la inicial', 'dateTo', '2026-10-01'],
    ['con un lugar que no existe', 'places', [{ placeId: 999, classroomId: null }]],
    ['con un aula de otro lugar', 'places', [{ placeId: 98, classroomId: 216 }]],
    ['con un texto de lugar demasiado largo', 'placeDescription', 'a'.repeat(301)],
  ])('no guarda un reporte %s', async (_name, field, value) => {
    const { lostReports, foundItems, foundItemPhotos } = fakes();

    const res = await request(createApp({ lostReports, foundItems, foundItemPhotos }))
      .post('/lost-reports')
      .send({ ...validReport, [field]: value });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty(field, expect.any(String));
    expect(lostReports.create).not.toHaveBeenCalled();
  });

  it('no deja que el cliente elija el código, el estado ni el dueño', async () => {
    const { lostReports, foundItems, foundItemPhotos } = fakes();

    await request(createApp({ lostReports, foundItems, foundItemPhotos }))
      .post('/lost-reports')
      .send({ ...validReport, code: 'PR-0001', status: 'RECOVERED', ownerId: SAMPLE_USERS.luis.id });

    const saved = lostReports.create.mock.calls[0][0];
    expect(saved).not.toHaveProperty('code');
    expect(saved).not.toHaveProperty('status');
    expect(saved.ownerId).toBe(SAMPLE_USERS.ana.id);
  });

  it('pide iniciar sesión cuando no hay sesión', async () => {
    const { lostReports, foundItems, foundItemPhotos } = fakes();

    const res = await request(createApp({ lostReports, foundItems, foundItemPhotos, allowSampleUsers: false }))
      .post('/lost-reports')
      .send(validReport);

    expect(res.status).toBe(401);
    expect(lostReports.create).not.toHaveBeenCalled();
  });

  it('responde con un error comprensible si no se pudo guardar', async () => {
    const { lostReports, foundItems, foundItemPhotos } = fakes();
    lostReports.create.mockRejectedValue(new Error('Detalle interno de Prisma'));

    const res = await request(createApp({ lostReports, foundItems, foundItemPhotos }))
      .post('/lost-reports')
      .send(validReport);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'No se pudo registrar tu reporte. Intenta nuevamente.' });
  });
});

// Imagen PNG real de 1x1 píxel, solo para las pruebas.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

describe('Subir una foto de referencia (POST /lost-reports)', () => {
  it('guarda la foto en el almacenamiento privado y su ruta en el reporte', async () => {
    const { lostReports, foundItems, foundItemPhotos } = fakes();

    const res = await request(createApp({ lostReports, foundItems, foundItemPhotos }))
      .post('/lost-reports')
      .field('report', JSON.stringify(validReport))
      .attach('photo', PNG, { filename: 'llaves.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(foundItemPhotos.upload).toHaveBeenCalledTimes(1);
    const [path] = foundItemPhotos.upload.mock.calls[0];
    expect(path).toMatch(new RegExp(`^${SAMPLE_USERS.ana.id}/[a-f0-9-]+\\.png$`));
    expect(lostReports.create).toHaveBeenCalledWith(expect.objectContaining({ photoUrl: path }));
  });

  it('borra la foto subida si el reporte no se pudo guardar', async () => {
    const { lostReports, foundItems, foundItemPhotos } = fakes();
    lostReports.create.mockRejectedValue(new Error('Detalle interno de Prisma'));

    const res = await request(createApp({ lostReports, foundItems, foundItemPhotos }))
      .post('/lost-reports')
      .field('report', JSON.stringify(validReport))
      .attach('photo', PNG, { filename: 'llaves.png', contentType: 'image/png' });

    expect(res.status).toBe(500);
    expect(foundItemPhotos.remove).toHaveBeenCalledWith(foundItemPhotos.upload.mock.calls[0][0]);
  });

  it('no sube nada si el reporte no es válido', async () => {
    const { lostReports, foundItems, foundItemPhotos } = fakes();

    const res = await request(createApp({ lostReports, foundItems, foundItemPhotos }))
      .post('/lost-reports')
      .field('report', JSON.stringify({ ...validReport, description: '' }))
      .attach('photo', PNG, { filename: 'llaves.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(foundItemPhotos.upload).not.toHaveBeenCalled();
  });
});