import request from 'supertest';
import { createApp } from '../../app';
import type { UsersRepository } from '../../core/data/usersRepository';
import { SAMPLE_USERS } from '../../core/sampleUsers';
import type { FoundItemCatalogs, FoundItemsRepository } from '../data/foundItemsRepository';

// Datos simulados: ninguna prueba consulta ni escribe en Supabase.
const catalogs: FoundItemCatalogs = {
  categories: [{ id: 47, name: 'Llaves' }],
  places: [
    { id: 83, name: 'Bloque A', type: 'BLOCK', classrooms: [{ id: 216, name: 'Aula A-12' }] },
    { id: 84, name: 'Bloque B', type: 'BLOCK', classrooms: [{ id: 217, name: 'Aula B-12' }] },
    { id: 98, name: 'Biblioteca', type: 'SPACE', classrooms: [] },
  ],
};
const validReport = {
  description: 'Llaves con llavero azul',
  categoryId: 47,
  placeId: 83,
  classroomId: 216,
  placeReference: 'Sobre la mesa',
  foundAt: '2026-10-18T08:15:00-04:00',
};
const created = { code: 'HZ-7321', status: 'PENDING_DROP_OFF' };

function fakeFoundItems(): jest.Mocked<FoundItemsRepository> {
  return {
    getPhotoByCode: jest.fn().mockResolvedValue(null),
    getCatalogs: jest.fn().mockResolvedValue(catalogs),
    create: jest.fn().mockResolvedValue(created),
  };
}

describe('Catálogos reales del formulario (GET /found-items/catalogs)', () => {
  it('exige una sesión antes de consultar los catálogos', async () => {
    const foundItems = fakeFoundItems();

    const res = await request(createApp({ foundItems, allowSampleUsers: false }))
      .get('/found-items/catalogs');

    expect(res.status).toBe(401);
    expect(foundItems.getCatalogs).not.toHaveBeenCalled();
  });

  it('devuelve los identificadores de categorías, lugares y aulas entregados por el repositorio', async () => {
    const foundItems = fakeFoundItems();

    const res = await request(createApp({ foundItems })).get('/found-items/catalogs');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(catalogs);
    expect(foundItems.getCatalogs).toHaveBeenCalledTimes(1);
    expect(foundItems.create).not.toHaveBeenCalled();
  });

  it('responde con un error comprensible si falla la consulta de catálogos', async () => {
    const foundItems = fakeFoundItems();
    foundItems.getCatalogs.mockRejectedValue(new Error('Información interna de Prisma'));

    const res = await request(createApp({ foundItems })).get('/found-items/catalogs');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'No se pudieron cargar las categorías y ubicaciones. Intenta nuevamente.' });
    expect(foundItems.create).not.toHaveBeenCalled();
  });
});

describe('Autenticación del hallador (POST /found-items)', () => {
  it('rechaza solicitudes sin sesión cuando los usuarios de prueba están desactivados', async () => {
    const foundItems = fakeFoundItems();

    const res = await request(createApp({ foundItems, allowSampleUsers: false }))
      .post('/found-items').send(validReport);

    expect(res.status).toBe(401);
    expect(foundItems.getCatalogs).not.toHaveBeenCalled();
    expect(foundItems.create).not.toHaveBeenCalled();
  });

  it('rechaza un token inválido antes de consultar o guardar el reporte', async () => {
    const foundItems = fakeFoundItems();
    const verifyToken = jest.fn().mockResolvedValue(null);

    const res = await request(createApp({ foundItems, verifyToken, allowSampleUsers: false }))
      .post('/found-items').set('Authorization', 'Bearer token-invalido').send(validReport);

    expect(res.status).toBe(401);
    expect(verifyToken).toHaveBeenCalledWith('token-invalido');
    expect(foundItems.getCatalogs).not.toHaveBeenCalled();
    expect(foundItems.create).not.toHaveBeenCalled();
  });

  it('identifica al hallador por su sesión aunque el cliente envíe otro identificador', async () => {
    const foundItems = fakeFoundItems();
    const profile = { ...SAMPLE_USERS.ana, email: 'ana.rojas@ucb.edu.bo', photoUrl: null };
    const verifyToken = jest.fn().mockResolvedValue(profile);
    const users: UsersRepository = {
      findById: jest.fn().mockResolvedValue(profile),
      create: jest.fn(),
      listWelfareEmails: jest.fn(),
    };

    const res = await request(createApp({ foundItems, verifyToken, users, allowSampleUsers: false }))
      .post('/found-items')
      .set('Authorization', 'Bearer token-valido')
      .set('x-sample-user', 'luis')
      .send({ ...validReport, finderId: SAMPLE_USERS.luis.id });

    expect(res.status).toBe(201);
    expect(foundItems.create).toHaveBeenCalledWith(expect.objectContaining({ finderId: profile.id }));
    expect(users.create).not.toHaveBeenCalled();
  });

  it('conserva la restricción institucional de la autenticación existente', async () => {
    const foundItems = fakeFoundItems();
    const verifyToken = jest.fn().mockResolvedValue({ ...SAMPLE_USERS.ana, email: 'ana@gmail.com' });

    const res = await request(createApp({ foundItems, verifyToken, allowSampleUsers: false }))
      .post('/found-items').set('Authorization', 'Bearer token-externo').send(validReport);

    expect(res.status).toBe(403);
    expect(foundItems.create).not.toHaveBeenCalled();
  });
});

describe('Validaciones del reporte encontrado (POST /found-items)', () => {
  it.each([
    ['descripción ausente', 'description', undefined],
    ['descripción vacía', 'description', ''],
    ['descripción de espacios', 'description', '  \n\t '],
    ['descripción de otro tipo', 'description', 123],
    ['categoría ausente', 'categoryId', undefined],
    ['categoría no numérica', 'categoryId', '47'],
    ['categoría negativa', 'categoryId', -1],
    ['categoría cero', 'categoryId', 0],
    ['categoría decimal', 'categoryId', 47.5],
    ['categoría fuera del rango de Prisma', 'categoryId', 2147483648],
    ['lugar ausente', 'placeId', undefined],
    ['lugar no numérico', 'placeId', '83'],
    ['lugar cero', 'placeId', 0],
    ['lugar negativo', 'placeId', -83],
    ['lugar decimal', 'placeId', 83.5],
    ['fecha ausente', 'foundAt', undefined],
    ['fecha vacía', 'foundAt', ''],
    ['fecha de otro tipo', 'foundAt', 1792325700000],
    ['fecha ilegible', 'foundAt', 'ayer'],
    ['fecha sin hora explícita', 'foundAt', '2026-10-18'],
    ['fecha sin zona explícita', 'foundAt', '2026-10-18T08:15:00'],
    ['fecha imposible', 'foundAt', '2026-02-30T08:15:00-04:00'],
    ['año no bisiesto', 'foundAt', '2025-02-29T08:15:00-04:00'],
    ['mes imposible', 'foundAt', '2026-13-18T08:15:00-04:00'],
    ['hora imposible', 'foundAt', '2026-10-18T25:15:00-04:00'],
    ['hora que pasa al día siguiente', 'foundAt', '2026-10-18T24:00:00-04:00'],
    ['minutos imposibles', 'foundAt', '2026-10-18T08:75:00-04:00'],
    ['zona imposible', 'foundAt', '2026-10-18T08:15:00+25:00'],
    ['aula no numérica', 'classroomId', '216'],
    ['aula cero', 'classroomId', 0],
    ['aula negativa', 'classroomId', -216],
    ['aula decimal', 'classroomId', 216.5],
    ['referencia de otro tipo', 'placeReference', 123],
    ['referencia demasiado larga', 'placeReference', 'a'.repeat(201)],
    ['fotografía externa sin verificar', 'photoUrl', 'https://otro-servidor.example/foto.jpg'],
    ['ruta de fotografía sin verificar', 'photoUrl', 'otro-usuario/foto.jpg'],
  ])('rechaza %s sin guardar el reporte', async (_name, field, value) => {
    const foundItems = fakeFoundItems();

    const res = await request(createApp({ foundItems }))
      .post('/found-items').send({ ...validReport, [field]: value });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Revisa los datos del reporte.');
    expect(res.body.errors).toHaveProperty(field, expect.any(String));
    expect(foundItems.create).not.toHaveBeenCalled();
  });

  it('identifica todos los campos obligatorios cuando el cuerpo está vacío', async () => {
    const foundItems = fakeFoundItems();

    const res = await request(createApp({ foundItems })).post('/found-items').send({});

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors).sort()).toEqual(['categoryId', 'description', 'foundAt', 'placeId']);
    expect(foundItems.create).not.toHaveBeenCalled();
  });

  it.each([
    ['categoría inexistente o inactiva', 'categoryId', 999],
    ['lugar inexistente o inactivo', 'placeId', 999],
    ['aula inexistente o inactiva', 'classroomId', 999],
    ['aula de otro bloque', 'classroomId', 217],
  ])('rechaza %s según los catálogos activos del repositorio', async (_name, field, value) => {
    const foundItems = fakeFoundItems();

    const res = await request(createApp({ foundItems }))
      .post('/found-items').send({ ...validReport, [field]: value });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty(field, expect.any(String));
    expect(foundItems.getCatalogs).toHaveBeenCalledTimes(1);
    expect(foundItems.create).not.toHaveBeenCalled();
  });

  it('rechaza un aula al seleccionar un espacio sin aulas', async () => {
    const foundItems = fakeFoundItems();

    const res = await request(createApp({ foundItems }))
      .post('/found-items').send({ ...validReport, placeId: 98 });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('classroomId', expect.any(String));
    expect(foundItems.create).not.toHaveBeenCalled();
  });

  it('rechaza un cuerpo que no representa un reporte', async () => {
    const foundItems = fakeFoundItems();

    const res = await request(createApp({ foundItems })).post('/found-items').send([]);

    expect(res.status).toBe(400);
    expect(foundItems.create).not.toHaveBeenCalled();
  });
});

describe('Guardar un reporte encontrado (POST /found-items)', () => {
  it('guarda una sola vez y devuelve el código entregado por el repositorio', async () => {
    const foundItems = fakeFoundItems();

    const res = await request(createApp({ foundItems })).post('/found-items').send(validReport);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
    expect(foundItems.create).toHaveBeenCalledTimes(1);
    expect(foundItems.create).toHaveBeenCalledWith({
      description: validReport.description,
      categoryId: 47,
      placeId: 83,
      classroomId: 216,
      placeReference: validReport.placeReference,
      foundAt: new Date('2026-10-18T12:15:00.000Z'),
      finderId: SAMPLE_USERS.ana.id,
    });
  });

  it('limpia espacios de descripción y referencia sin modificar el contenido', async () => {
    const foundItems = fakeFoundItems();

    const res = await request(createApp({ foundItems })).post('/found-items').send({
      ...validReport,
      description: '  Llaves con llavero azul  ',
      placeReference: '  Sobre la mesa  ',
    });

    expect(res.status).toBe(201);
    expect(foundItems.create).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Llaves con llavero azul',
      placeReference: 'Sobre la mesa',
    }));
  });

  it.each([
    ['2026-10-18T12:15:00Z', '2026-10-18T12:15:00.000Z'],
    ['2026-10-18T08:15:00.125-04:00', '2026-10-18T12:15:00.125Z'],
    ['2026-10-18T19:15:00+07:00', '2026-10-18T12:15:00.000Z'],
    ['2024-02-29T23:45:00-04:00', '2024-03-01T03:45:00.000Z'],
  ])('conserva el instante indicado en %s sin depender de la zona del servidor', async (foundAt, expected) => {
    const foundItems = fakeFoundItems();

    const res = await request(createApp({ foundItems }))
      .post('/found-items').send({ ...validReport, foundAt });

    expect(res.status).toBe(201);
    expect(foundItems.create).toHaveBeenCalledWith(expect.objectContaining({ foundAt: new Date(expected) }));
  });

  it.each([83, 98])('permite guardar en el lugar %s sin aula, referencia ni fotografía', async (placeId) => {
    const foundItems = fakeFoundItems();
    const { classroomId: _classroom, placeReference: _reference, ...required } = validReport;

    const res = await request(createApp({ foundItems }))
      .post('/found-items').send({ ...required, placeId });

    expect(res.status).toBe(201);
    expect(foundItems.create).toHaveBeenCalledWith(expect.objectContaining({
      placeId,
      classroomId: null,
      placeReference: null,
    }));
    expect(foundItems.create.mock.calls[0][0]).not.toHaveProperty('photoUrl');
  });

  it('acepta valores opcionales nulos sin tratar una foto como verificada', async () => {
    const foundItems = fakeFoundItems();

    const res = await request(createApp({ foundItems })).post('/found-items').send({
      ...validReport,
      classroomId: null,
      placeReference: null,
      photoUrl: null,
    });

    expect(res.status).toBe(201);
    expect(foundItems.create.mock.calls[0][0]).not.toHaveProperty('photoUrl');
  });

  it('no permite que el cliente asigne código, estado ni datos de publicación o recepción', async () => {
    const foundItems = fakeFoundItems();

    const res = await request(createApp({ foundItems })).post('/found-items').send({
      ...validReport,
      code: 'HZ-0000',
      status: 'PUBLISHED',
      visibility: 'VISIBLE',
      publishedAt: '2026-10-18T12:00:00Z',
      publishedById: SAMPLE_USERS.welfare.id,
      receivedAt: '2026-10-18T12:00:00Z',
      receivedById: SAMPLE_USERS.welfare.id,
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
    for (const field of ['code', 'status', 'visibility', 'publishedAt', 'publishedById', 'receivedAt', 'receivedById']) {
      expect(foundItems.create.mock.calls[0][0]).not.toHaveProperty(field);
    }
  });

  it('espera a que termine el guardado antes de devolver el código', async () => {
    const foundItems = fakeFoundItems();
    foundItems.create.mockImplementation(async () => {
      await Promise.resolve();
      return { code: 'HZ-9881', status: 'PENDING_DROP_OFF' };
    });

    const res = await request(createApp({ foundItems })).post('/found-items').send(validReport);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ code: 'HZ-9881', status: 'PENDING_DROP_OFF' });
  });

  it('devuelve un error controlado sin código si falla el guardado', async () => {
    const foundItems = fakeFoundItems();
    foundItems.create.mockRejectedValue(new Error('Detalle privado de la conexión Prisma'));

    const res = await request(createApp({ foundItems })).post('/found-items').send(validReport);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'No se pudo registrar el objeto encontrado. Intenta nuevamente.' });
    expect(res.body).not.toHaveProperty('code');
    expect(foundItems.create).toHaveBeenCalledTimes(1);
  });

  it('no intenta guardar si falla la lectura de catálogos', async () => {
    const foundItems = fakeFoundItems();
    foundItems.getCatalogs.mockRejectedValue(new Error('Detalle privado de la conexión Prisma'));

    const res = await request(createApp({ foundItems })).post('/found-items').send(validReport);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'No se pudo registrar el objeto encontrado. Intenta nuevamente.' });
    expect(foundItems.create).not.toHaveBeenCalled();
  });
});
