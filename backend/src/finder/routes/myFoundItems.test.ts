import request from 'supertest';
import { createApp } from '../../app';
import { SAMPLE_USERS } from '../../core/sampleUsers';
import type { UsersRepository } from '../../core/data/usersRepository';
import type { FoundItemsRepository } from '../data/foundItemsRepository';

function fakeFoundItems(): jest.Mocked<FoundItemsRepository> {
  return {
    listMine: jest.fn().mockResolvedValue([]),
    getMineByCode: jest.fn().mockResolvedValue(null),
    getPhotoByCode: jest.fn(),
    getCatalogs: jest.fn(),
    create: jest.fn(),
  };
}

describe('Mis reportes encontrados (GET /my-found-items)', () => {
  it('exige una sesión antes de consultar los reportes', async () => {
    const foundItems = fakeFoundItems();
    const res = await request(createApp({ foundItems, allowSampleUsers: false })).get('/my-found-items');

    expect(res.status).toBe(401);
    expect(foundItems.listMine).not.toHaveBeenCalled();
  });

  it('consulta todos los reportes del usuario de la sesión e ignora el hallador enviado por el cliente', async () => {
    const foundItems = fakeFoundItems();
    const reports = [{ code: 'HZ-7325', description: 'Llaves pendientes de entrega', category: 'Llaves',
      foundAt: new Date('2026-10-18T12:15:00.000Z'), hasPhoto: true,
      status: 'PENDING_DROP_OFF' as const, receivedAt: null },
    { code: 'HZ-7324', description: 'Mochila recibida', category: 'Mochilas y bolsos',
      foundAt: new Date('2026-10-17T12:15:00.000Z'), hasPhoto: false,
      status: 'IN_CUSTODY' as const, receivedAt: new Date('2026-10-19T14:30:00.000Z') }];
    foundItems.listMine.mockResolvedValue(reports);
    const profile = { ...SAMPLE_USERS.ana, email: 'ana.rojas@ucb.edu.bo' };
    const users: UsersRepository = {
      findById: jest.fn().mockResolvedValue(profile), create: jest.fn(),
      markGuideSeen: jest.fn(), listWelfareEmails: jest.fn(),
    };
    const app = createApp({ foundItems, users, allowSampleUsers: false,
      verifyToken: jest.fn().mockResolvedValue(profile) });

    const res = await request(app).get(`/my-found-items?finderId=${SAMPLE_USERS.luis.id}`)
      .set('Authorization', 'Bearer sesion-valida').set('x-sample-user', 'luis');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(JSON.parse(JSON.stringify(reports)));
    expect(foundItems.listMine).toHaveBeenCalledWith(profile.id);
  });

  it('devuelve una lista vacía cuando el hallador todavía no reportó objetos', async () => {
    const res = await request(createApp({ foundItems: fakeFoundItems() })).get('/my-found-items');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('responde con un error controlado sin revelar información interna', async () => {
    const foundItems = fakeFoundItems();
    foundItems.listMine.mockRejectedValue(new Error('Detalle privado de Prisma'));

    const res = await request(createApp({ foundItems })).get('/my-found-items');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'No se pudieron cargar tus reportes. Intenta nuevamente.' });
    expect(res.headers['cache-control']).toBe('private, no-store');
  });
});

describe('Detalle privado de un reporte encontrado (GET /my-found-items/:code)', () => {
  const report = { code: 'HZ-7325', description: 'Llaves azules', category: 'Llaves',
    foundAt: new Date('2026-10-18T12:15:00.000Z'), hasPhoto: true,
    status: 'PENDING_DROP_OFF' as const, receivedAt: null };

  function setup() {
    const foundItems = fakeFoundItems();
    const records = [{ finderId: SAMPLE_USERS.ana.id, report },
      { finderId: SAMPLE_USERS.luis.id, report: { ...report, code: 'HZ-7326', description: 'Reporte privado de Luis' } }];
    foundItems.getMineByCode.mockImplementation(async (finderId, code) =>
      records.find((record) => record.finderId === finderId && record.report.code === code)?.report ?? null);
    return { foundItems, app: createApp({ foundItems }) };
  }

  it('exige autenticación antes de consultar un detalle', async () => {
    const foundItems = fakeFoundItems();
    const res = await request(createApp({ foundItems, allowSampleUsers: false })).get('/my-found-items/HZ-7325');

    expect(res.status).toBe(401);
    expect(foundItems.getMineByCode).not.toHaveBeenCalled();
  });

  it('recupera el código propio en cada consulta aunque no se haya abierto antes la lista', async () => {
    const { app, foundItems } = setup();
    for (let visit = 0; visit < 2; visit++) {
      const res = await request(app).get('/my-found-items/HZ-7325');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(JSON.parse(JSON.stringify(report)));
      expect(res.headers['cache-control']).toBe('private, no-store');
      expect(res.body).not.toHaveProperty('photoUrl');
    }
    expect(foundItems.getMineByCode).toHaveBeenCalledWith(SAMPLE_USERS.ana.id, report.code);
    expect(foundItems.listMine).not.toHaveBeenCalled();
  });

  it.each(['luis', 'welfare'])('impide que %s abra el reporte privado de Ana', async (user) => {
    const { app, foundItems } = setup();

    const res = await request(app).get(`/my-found-items/HZ-7325?finderId=${SAMPLE_USERS.ana.id}`)
      .set('x-sample-user', user);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'No encontramos este reporte.' });
    expect(foundItems.getMineByCode).not.toHaveBeenCalledWith(SAMPLE_USERS.ana.id, report.code);
  });

  it('responde igual ante un código ajeno y uno inexistente sin revelar la descripción privada', async () => {
    const { app } = setup();

    const other = await request(app).get('/my-found-items/HZ-7326');
    const missing = await request(app).get('/my-found-items/HZ-9999');

    expect(other.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(other.body).toEqual(missing.body);
    expect(other.body).toEqual({ error: 'No encontramos este reporte.' });
  });

  it('rechaza códigos ajenos al formato de hallazgo antes de consultar el repositorio', async () => {
    const { app, foundItems } = setup();

    const res = await request(app).get('/my-found-items/PR-0001');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'No encontramos este reporte.' });
    expect(foundItems.getMineByCode).not.toHaveBeenCalled();
  });

  it('controla un error de consulta sin revelar información interna', async () => {
    const { app, foundItems } = setup();
    foundItems.getMineByCode.mockRejectedValue(new Error('Detalle privado de Prisma'));

    const res = await request(app).get('/my-found-items/HZ-7325');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'No se pudo cargar el reporte. Intenta nuevamente.' });
  });
});
