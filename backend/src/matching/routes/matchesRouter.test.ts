import request from 'supertest';
import { createApp } from '../../app';
import { SAMPLE_USERS } from '../../core/sampleUsers';
import { fakeSettingsRepository } from '../../core/data/fakeSettingsRepository';
import {
  fakeMatchingRepository,
  type FakeItem,
  type FakeReport,
} from '../data/fakeMatchingRepository';
import { fakeNotificationsRepository } from '../../core/data/fakeNotificationsRepository';

const anasReport: FakeReport = {
  id: 'report-1',
  code: 'PR-0001',
  ownerId: SAMPLE_USERS.ana.id,
  categoryId: 1,
  dateFrom: new Date('2026-10-10'),
  dateTo: new Date('2026-10-11'),
  placeIds: [5],
  description: 'Perdí mi celular Samsung, tiene funda azul',
};

const foundOn = new Date('2026-10-11T15:00:00Z');
const items: FakeItem[] = [
  {
    id: 'i2',
    code: 'HZ-0002',
    categoryId: 1,
    foundAt: foundOn,
    placeId: 9,
    description: 'Celular negro',
    photoUrl: null,
    category: 'Electrónicos',
  },
  {
    id: 'i1',
    code: 'HZ-0001',
    categoryId: 1,
    foundAt: foundOn,
    placeId: 5,
    description: 'Celular Samsung con funda azul',
    photoUrl: null,
    category: 'Electrónicos',
  },
  {
    id: 'i3',
    code: 'HZ-0003',
    categoryId: 2,
    foundAt: foundOn,
    placeId: 5,
    description: 'Mochila azul',
    photoUrl: null,
    category: 'Mochilas y bolsos',
  },
];

describe('Ver los objetos parecidos a mi reporte (GET /lost-reports/:code/matches)', () => {
  it('no permite que Bienestar consulte coincidencias de un reporte recuperado', async () => {
    const { repository } = fakeMatchingRepository([{ ...anasReport, status: 'RECOVERED' }], items);

    const res = await request(
      createApp({ notifications: fakeNotificationsRepository(), matching: repository, settings: fakeSettingsRepository() }),
    )
      .get('/lost-reports/PR-0001/matches')
      .set('x-sample-user', 'welfare');

    expect(res.status).toBe(404);
  });

  it('no permite que Bienestar consulte coincidencias de un reporte cerrado', async () => {
    const { repository } = fakeMatchingRepository([{ ...anasReport, status: 'CLOSED' }], items);

    const res = await request(
      createApp({
        notifications: fakeNotificationsRepository(),
        matching: repository,
        settings: fakeSettingsRepository(),
      }),
    )
      .get('/lost-reports/PR-0001/matches')
      .set('x-sample-user', 'welfare');

    expect(res.status).toBe(404);
  });

  it('permite que Bienestar consulte el reporte de otra persona', async () => {
    const { repository } = fakeMatchingRepository([anasReport], items);

    const res = await request(
      createApp({ notifications: fakeNotificationsRepository(), matching: repository, settings: fakeSettingsRepository() }),
    )
      .get('/lost-reports/PR-0001/matches')
      .set('x-sample-user', 'welfare');

    expect(res.status).toBe(200);
    expect(res.body.map((match: { foundItem: { code: string } }) => match.foundItem.code)).toEqual([
      'HZ-0001',
      'HZ-0002',
    ]);
  });

  it('muestra los objetos publicados parecidos, del más parecido al menos parecido', async () => {
    const { repository } = fakeMatchingRepository([anasReport], items);

    const res = await request(
      createApp({ notifications: fakeNotificationsRepository(), matching: repository, settings: fakeSettingsRepository() }),
    ).get('/lost-reports/PR-0001/matches');

    expect(res.status).toBe(200);
    expect(res.body.map((match: { foundItem: { code: string } }) => match.foundItem.code)).toEqual([
      'HZ-0001',
      'HZ-0002',
    ]);
  });

  it('no muestra el reporte de otra persona', async () => {
    const { repository } = fakeMatchingRepository(
      [{ ...anasReport, ownerId: SAMPLE_USERS.luis.id }],
      items,
    );

    const res = await request(
      createApp({ notifications: fakeNotificationsRepository(), matching: repository, settings: fakeSettingsRepository() }),
    ).get('/lost-reports/PR-0001/matches');

    expect(res.status).toBe(404);
  });

  describe('Pasaré a recoger (POST /matches/:id/pick-up)', () => {
    it('avisa a Bienestar que el dueño pasará a recoger el objeto', async () => {
      const { repository, matches } = fakeMatchingRepository([anasReport], items);
      const notifications = fakeNotificationsRepository([], {
        WELFARE: [SAMPLE_USERS.welfare.id],
      });
      const app = createApp({
        matching: repository,
        settings: fakeSettingsRepository(),
        notifications,
      });
      await request(app).get('/lost-reports/PR-0001/matches');

      const res = await request(app).post(`/matches/${matches[0].id}/pick-up`);

      expect(res.status).toBe(200);
      expect(matches[0].status).toBe('WILL_PICK_UP');
      await expect(notifications.listForUser(SAMPLE_USERS.welfare.id)).resolves.toEqual([
        expect.objectContaining({
          message: 'Ana Rojas pasará a recoger el objeto HZ-0001 del reporte PR-0001.',
          link: '/bienestar',
          readAt: null,
        }),
      ]);
    });

    it('no deja responder por una coincidencia del reporte de otra persona', async () => {
      const { repository, matches } = fakeMatchingRepository([anasReport], items);
      const app = createApp({ notifications: fakeNotificationsRepository(), matching: repository, settings: fakeSettingsRepository() });
      await request(app).get('/lost-reports/PR-0001/matches');

      const res = await request(app)
        .post(`/matches/${matches[0].id}/pick-up`)
        .set('x-sample-user', 'luis');

      expect(res.status).toBe(404);
      expect(matches[0].status).toBe('SUGGESTED');
    });
  });

  describe('No es mío (POST /matches/:id/dismiss)', () => {
    it('quita el objeto de los parecidos a su reporte', async () => {
      const { repository, matches } = fakeMatchingRepository([anasReport], items);
      const app = createApp({ notifications: fakeNotificationsRepository(), matching: repository, settings: fakeSettingsRepository() });
      await request(app).get('/lost-reports/PR-0001/matches');

      const res = await request(app).post(`/matches/${matches[0].id}/dismiss`);
      const after = await request(app).get('/lost-reports/PR-0001/matches');

      expect(res.status).toBe(200);
      expect(
        after.body.map((match: { foundItem: { code: string } }) => match.foundItem.code),
      ).toEqual(['HZ-0002']);
    });
  });
});

describe('Las nuevas coincidencias respetan el nivel mínimo que guardó el Administrador', () => {
  it('con un nivel de 60 solo muestra el objeto más parecido', async () => {
    const { repository } = fakeMatchingRepository([anasReport], items);
    const settings = fakeSettingsRepository();
    await settings.updateMatchSettings({ minSimilarity: 60 });

    const res = await request(createApp({ notifications: fakeNotificationsRepository(), matching: repository, settings })).get(
      '/lost-reports/PR-0001/matches',
    );

    expect(res.body.map((match: { foundItem: { code: string } }) => match.foundItem.code)).toEqual([
      'HZ-0001',
    ]);
  });
});


describe('Reclamar un objeto del catálogo (POST /catalog/:code/claim)', () => {
  const claim = (app: ReturnType<typeof createApp>, itemCode: string, body: object = { reportCode: 'PR-0001' }) =>
    request(app).post(`/catalog/${itemCode}/claim`).send(body);

  it('avisa a Bienestar que el dueño pasará a recoger el objeto aunque no fuera una coincidencia', async () => {
    const { repository, matches, reports } = fakeMatchingRepository([anasReport], items);
    const app = createApp({ matching: repository, settings: fakeSettingsRepository() });

    const res = await claim(app, 'HZ-0003');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'WILL_PICK_UP' });
    expect(matches).toHaveLength(1);
    expect(matches[0].foundItem.code).toBe('HZ-0003');
    expect(matches[0].status).toBe('WILL_PICK_UP');
    expect(reports[0].status).toBe('PENDING_PICKUP');
  });

  it('usa la coincidencia que ya existía en vez de crear otra', async () => {
    const { repository, matches } = fakeMatchingRepository([anasReport], items);
    const app = createApp({ matching: repository, settings: fakeSettingsRepository() });
    await request(app).get('/lost-reports/PR-0001/matches');

    const res = await claim(app, 'HZ-0001');

    expect(res.status).toBe(200);
    expect(matches).toHaveLength(2);
    expect(matches.find((match) => match.foundItem.code === 'HZ-0001')?.status).toBe('WILL_PICK_UP');
    expect(matches.find((match) => match.foundItem.code === 'HZ-0002')?.status).toBe('SUGGESTED');
  });

  it('si el dueño lo reclama dos veces, queda una sola coincidencia', async () => {
    const { repository, matches } = fakeMatchingRepository([anasReport], items);
    const app = createApp({ matching: repository, settings: fakeSettingsRepository() });

    await claim(app, 'HZ-0003');
    const res = await claim(app, 'HZ-0003');

    expect(res.status).toBe(200);
    expect(matches).toHaveLength(1);
  });

  it('pide el código del reporte', async () => {
    const { repository, matches } = fakeMatchingRepository([anasReport], items);
    const app = createApp({ matching: repository, settings: fakeSettingsRepository() });

    const res = await claim(app, 'HZ-0003', {});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'reportCode is required' });
    expect(matches).toHaveLength(0);
  });

  it('no deja reclamar con el reporte de otra persona', async () => {
    const { repository, matches } = fakeMatchingRepository([anasReport], items);
    const app = createApp({ matching: repository, settings: fakeSettingsRepository() });

    const res = await claim(app, 'HZ-0003').set('x-sample-user', 'luis');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Lost report not found' });
    expect(matches).toHaveLength(0);
  });

  it('no deja reclamar un objeto que no está publicado', async () => {
    const notPublished = items.map((item) =>
      item.code === 'HZ-0003' ? { ...item, status: 'IN_CUSTODY' as const } : item,
    );
    const { repository, matches } = fakeMatchingRepository([anasReport], notPublished);
    const app = createApp({ matching: repository, settings: fakeSettingsRepository() });

    const res = await claim(app, 'HZ-0003');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Found item not found' });
    expect(matches).toHaveLength(0);
  });

  it('no deja reclamar con un reporte que ya fue recuperado', async () => {
    const { repository, matches } = fakeMatchingRepository([{ ...anasReport, status: 'RECOVERED' }], items);
    const app = createApp({ matching: repository, settings: fakeSettingsRepository() });

    const res = await claim(app, 'HZ-0003');

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Lost report already recovered' });
    expect(matches).toHaveLength(0);
  });

  it('no deja reclamar con un reporte que ya fue cerrado', async () => {
    const { repository, matches } = fakeMatchingRepository([{ ...anasReport, status: 'CLOSED' }], items);
    const app = createApp({
      notifications: fakeNotificationsRepository(),
      matching: repository,
      settings: fakeSettingsRepository(),
    });

    const res = await claim(app, 'HZ-0003');

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Lost report closed' });
    expect(matches).toHaveLength(0);
  });
});
describe('Coincidencias con un objeto que no es visible', () => {
  const hiddenPhone: FakeItem = {
    id: 'i4',
    code: 'HZ-0004',
    categoryId: 1,
    foundAt: foundOn,
    placeId: 5,
    description: 'Celular Samsung con funda azul y vidrio roto',
    photoUrl: 'https://foto.com/celular.jpg',
    category: 'Electrónicos',
    visibility: 'HIDDEN',
  };

  it('el dueño recibe la coincidencia marcada como no visible', async () => {
    const { repository } = fakeMatchingRepository([anasReport], [hiddenPhone]);

    const res = await request(
      createApp({ matching: repository, settings: fakeSettingsRepository() }),
    ).get('/lost-reports/PR-0001/matches');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([expect.objectContaining({ isHidden: true })]);
  });

  it('una coincidencia con un objeto visible no se marca como no visible', async () => {
    const { repository } = fakeMatchingRepository([anasReport], items);

    const res = await request(
      createApp({ matching: repository, settings: fakeSettingsRepository() }),
    ).get('/lost-reports/PR-0001/matches');

    expect(res.body.map((match: { isHidden: boolean }) => match.isHidden)).toEqual([false, false]);
  });

  it('el dueño no recibe la foto ni los datos del objeto', async () => {
    const { repository } = fakeMatchingRepository([anasReport], [hiddenPhone]);

    const res = await request(
      createApp({ matching: repository, settings: fakeSettingsRepository() }),
    ).get('/lost-reports/PR-0001/matches');

    expect(res.body[0].foundItem).toEqual({
      code: '',
      description: '',
      photoUrl: null,
      category: '',
    });
  });

  it('Bienestar sí recibe los datos del objeto', async () => {
    const { repository } = fakeMatchingRepository([anasReport], [hiddenPhone]);

    const res = await request(
      createApp({ matching: repository, settings: fakeSettingsRepository() }),
    )
      .get('/lost-reports/PR-0001/matches')
      .set('x-sample-user', 'welfare');

    expect(res.body[0].foundItem).toEqual({
      code: 'HZ-0004',
      description: 'Celular Samsung con funda azul y vidrio roto',
      photoUrl: 'https://foto.com/celular.jpg',
      category: 'Electrónicos',
    });
  });
});

describe('Un reporte cerrado ya no recibe coincidencias', () => {
  it('no busca objetos parecidos para un reporte cerrado', async () => {
    const { repository, matches } = fakeMatchingRepository([{ ...anasReport, status: 'CLOSED' }], items);

    const res = await request(
      createApp({ notifications: fakeNotificationsRepository(), matching: repository, settings: fakeSettingsRepository() }),
    ).get('/lost-reports/PR-0001/matches');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(matches).toHaveLength(0);
  });

  it('no deja marcar "Pasaré a recoger" en un reporte cerrado', async () => {
    const { repository, matches, reports } = fakeMatchingRepository([anasReport], items);
    const notifications = fakeNotificationsRepository([], { WELFARE: [SAMPLE_USERS.welfare.id] });
    const app = createApp({ matching: repository, settings: fakeSettingsRepository(), notifications });
    await request(app).get('/lost-reports/PR-0001/matches');
    reports[0].status = 'CLOSED';

    const res = await request(app).post(`/matches/${matches[0].id}/pick-up`);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Lost report closed' });
    expect(matches[0].status).toBe('SUGGESTED');
    await expect(notifications.listForUser(SAMPLE_USERS.welfare.id)).resolves.toEqual([]);
  });
});
