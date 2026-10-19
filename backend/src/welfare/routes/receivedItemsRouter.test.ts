import request from 'supertest';
import { createApp } from '../../app';
import { SAMPLE_USERS } from '../../core/sampleUsers';
import { fakeWelfareRepository } from '../data/fakeWelfareRepository';

const pendingItem = {
  id: 'item-5',
  code: 'HZ-0005',
  description: 'Mochila negra con cuadernos',
  photoUrl: null,
  category: 'Mochilas',
  place: 'Bloque A',
  classroom: 'Aula 3',
  placeReference: 'Debajo de una mesa',
  foundAt: new Date('2026-10-15T14:00:00Z'),
  status: 'PENDING_DROP_OFF' as const,
  finder: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
};

const receivedItem = {
  ...pendingItem,
  id: 'item-4',
  code: 'HZ-0004',
  status: 'IN_CUSTODY' as const,
};

const publishedItem = {
  ...pendingItem,
  id: 'item-3',
  code: 'HZ-0003',
  status: 'PUBLISHED' as const,
};

const deliveredItem = {
  ...pendingItem,
  id: 'item-2',
  code: 'HZ-0002',
  status: 'DELIVERED' as const,
};

const pendingPickup = {
  matchId: 'match-1',
  matchStatus: 'WILL_PICK_UP' as const,
  reportStatus: 'PENDING_PICKUP' as const,
  owner: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
  report: { code: 'PR-0001' },
  foundItem: { code: 'HZ-0001', description: 'Celular Samsung con funda azul' },
};

describe('Recibir objetos encontrados en Bienestar', () => {
  it('rechaza un correo no institucional para la entrega', async () => {
    const { repository, items, deliveries } = fakeWelfareRepository([publishedItem]);
    const res = await request(createApp({ welfare: repository }))
      .post('/welfare/deliveries')
      .set('x-sample-user', 'welfare')
      .send({
        foundItemCode: 'HZ-0003',
        recipientName: 'Ana Rojas',
        recipientEmail: 'ana@gmail.com',
        recipientUniversityCode: '20205678',
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'INVALID_RECIPIENT_EMAIL' });
    expect(items[0].status).toBe('PUBLISHED');
    expect(deliveries).toEqual([]);
  });

  it('rechaza una entrega si faltan los datos obligatorios del receptor', async () => {
    const { repository, items, deliveries } = fakeWelfareRepository([publishedItem]);
    const res = await request(createApp({ welfare: repository }))
      .post('/welfare/deliveries')
      .set('x-sample-user', 'welfare')
      .send({ foundItemCode: 'HZ-0003', recipientName: 'Ana Rojas' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'INVALID_DELIVERY_DATA' });
    expect(items[0].status).toBe('PUBLISHED');
    expect(deliveries).toEqual([]);
  });

  it('entrega con su reporte relacionado y lo marca como recuperado', async () => {
    const pickupForItem = {
      ...pendingPickup,
      foundItem: { code: 'HZ-0003', description: publishedItem.description },
    };
    const { repository, items, pickups, deliveries } = fakeWelfareRepository(
      [publishedItem],
      [pickupForItem],
    );
    const res = await request(createApp({ welfare: repository }))
      .post('/welfare/deliveries')
      .set('x-sample-user', 'welfare')
      .send({
        foundItemCode: 'HZ-0003',
        lostReportCode: ' pr-0001 ',
        recipientName: 'Ana Rojas',
        recipientEmail: 'ana.rojas@ucb.edu.bo',
        recipientUniversityCode: '20205678',
      });

    expect(res.status).toBe(201);
    expect(items[0].status).toBe('DELIVERED');
    expect(pickups[0].reportStatus).toBe('RECOVERED');
    expect(deliveries[0]).toEqual(expect.objectContaining({ lostReportCode: 'PR-0001' }));
  });

  it('registra una entrega sin reporte y marca el objeto como entregado', async () => {
    const { repository, items, deliveries } = fakeWelfareRepository([publishedItem]);
    const res = await request(createApp({ welfare: repository }))
      .post('/welfare/deliveries')
      .set('x-sample-user', 'welfare')
      .send({
        foundItemCode: ' hz-0003 ',
        recipientName: 'Luis Mamani',
        recipientEmail: 'luis.mamani@ucb.edu.bo',
        recipientUniversityCode: '20201234',
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ status: 'DELIVERED', foundItemCode: 'HZ-0003' });
    expect(items[0].status).toBe('DELIVERED');
    expect(deliveries).toEqual([
      expect.objectContaining({
        foundItemCode: 'HZ-0003',
        lostReportCode: null,
        recipientName: 'Luis Mamani',
        recipientEmail: 'luis.mamani@ucb.edu.bo',
        recipientUniversityCode: '20201234',
        registeredById: SAMPLE_USERS.welfare.id,
        deliveredAt: expect.any(Date),
      }),
    ]);
  });

  it('protege el registro de entregas para Bienestar', async () => {
    const { repository } = fakeWelfareRepository([]);
    const res = await request(createApp({ welfare: repository })).post('/welfare/deliveries');

    expect(res.status).toBe(403);
  });

  it('protege la lista de recojos pendientes para Bienestar', async () => {
    const { repository } = fakeWelfareRepository([]);
    const res = await request(createApp({ welfare: repository })).get(
      '/welfare/pending-pickups',
    );

    expect(res.status).toBe(403);
  });

  it('lista solamente los propietarios que pasaran a recoger', async () => {
    const { repository } = fakeWelfareRepository([], [
      pendingPickup,
      { ...pendingPickup, matchId: 'match-2', matchStatus: 'SUGGESTED' },
      { ...pendingPickup, matchId: 'match-3', reportStatus: 'RECOVERED' },
    ]);
    const res = await request(createApp({ welfare: repository }))
      .get('/welfare/pending-pickups')
      .set('x-sample-user', 'welfare');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        matchId: 'match-1',
        owner: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
        report: { code: 'PR-0001' },
        foundItem: { code: 'HZ-0001', description: 'Celular Samsung con funda azul' },
      },
    ]);
  });

  it('lista solamente los objetos que siguen en la oficina', async () => {
    const { repository } = fakeWelfareRepository([
      pendingItem,
      receivedItem,
      publishedItem,
      deliveredItem,
    ]);
    const res = await request(createApp({ welfare: repository }))
      .get('/welfare/found-items/in-office')
      .set('x-sample-user', 'welfare');

    expect(res.status).toBe(200);
    expect(res.body.map((item: { code: string }) => item.code)).toEqual([
      'HZ-0004',
      'HZ-0003',
    ]);
  });

  it('lista los objetos que aun no fueron entregados', async () => {
    const { repository } = fakeWelfareRepository([pendingItem]);
    const res = await request(createApp({ welfare: repository }))
      .get('/welfare/found-items/pending')
      .set('x-sample-user', 'welfare');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      expect.objectContaining({
        code: 'HZ-0005',
        description: 'Mochila negra con cuadernos',
        finder: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
      }),
    ]);
  });

  it('no incluye objetos que ya estan en custodia', async () => {
    const { repository } = fakeWelfareRepository([pendingItem, receivedItem]);
    const res = await request(createApp({ welfare: repository }))
      .get('/welfare/found-items/pending')
      .set('x-sample-user', 'welfare');

    expect(res.body.map((item: { code: string }) => item.code)).toEqual(['HZ-0005']);
  });

  it('solo Bienestar puede consultar los pendientes', async () => {
    const { repository } = fakeWelfareRepository([pendingItem]);
    const res = await request(createApp({ welfare: repository })).get(
      '/welfare/found-items/pending',
    );

    expect(res.status).toBe(403);
  });

  it('busca un reporte por el codigo que muestra el Hallador', async () => {
    const { repository } = fakeWelfareRepository([pendingItem]);
    const res = await request(createApp({ welfare: repository }))
      .get('/welfare/found-items/HZ-0005')
      .set('x-sample-user', 'welfare');

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('HZ-0005');
  });

  it('normaliza espacios y minusculas', async () => {
    const { repository } = fakeWelfareRepository([pendingItem]);
    const res = await request(createApp({ welfare: repository }))
      .get('/welfare/found-items/%20hz-0005%20')
      .set('x-sample-user', 'welfare');

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('HZ-0005');
  });

  it('muestra los datos del objeto y del Hallador', async () => {
    const { repository } = fakeWelfareRepository([pendingItem]);
    const res = await request(createApp({ welfare: repository }))
      .get('/welfare/found-items/HZ-0005')
      .set('x-sample-user', 'welfare');

    expect(res.body).toEqual({
      code: 'HZ-0005',
      description: 'Mochila negra con cuadernos',
      photoUrl: null,
      category: 'Mochilas',
      place: 'Bloque A',
      classroom: 'Aula 3',
      placeReference: 'Debajo de una mesa',
      foundAt: '2026-10-15T14:00:00.000Z',
      status: 'PENDING_DROP_OFF',
      finder: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
    });
  });

  it('responde 404 si el codigo no existe', async () => {
    const { repository } = fakeWelfareRepository([pendingItem]);
    const res = await request(createApp({ welfare: repository }))
      .get('/welfare/found-items/HZ-9999')
      .set('x-sample-user', 'welfare');

    expect(res.status).toBe(404);
  });

  it('responde 409 si ya no esta pendiente', async () => {
    const { repository } = fakeWelfareRepository([receivedItem]);
    const res = await request(createApp({ welfare: repository }))
      .get('/welfare/found-items/HZ-0004')
      .set('x-sample-user', 'welfare');

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ code: 'ALREADY_RECEIVED' });
  });

  it('confirma que Bienestar recibio el objeto', async () => {
    const { repository } = fakeWelfareRepository([pendingItem]);
    const res = await request(createApp({ welfare: repository }))
      .post('/welfare/found-items/HZ-0005/receive')
      .set('x-sample-user', 'welfare');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ code: 'HZ-0005', status: 'IN_CUSTODY' }));
  });

  it('registra quien y cuando lo recibio', async () => {
    const { repository, items } = fakeWelfareRepository([pendingItem]);
    await request(createApp({ welfare: repository }))
      .post('/welfare/found-items/HZ-0005/receive')
      .set('x-sample-user', 'welfare');

    expect(items[0]).toEqual(
      expect.objectContaining({
        receivedById: SAMPLE_USERS.welfare.id,
        receivedAt: expect.any(Date),
      }),
    );
  });

  it('deja el objeto en custodia', async () => {
    const { repository, items } = fakeWelfareRepository([pendingItem]);
    await request(createApp({ welfare: repository }))
      .post('/welfare/found-items/HZ-0005/receive')
      .set('x-sample-user', 'welfare');

    expect(items[0].status).toBe('IN_CUSTODY');
    await expect(repository.listPending()).resolves.toEqual([]);
  });

  it('no permite confirmar dos veces', async () => {
    const { repository } = fakeWelfareRepository([pendingItem]);
    const app = createApp({ welfare: repository });
    await request(app)
      .post('/welfare/found-items/HZ-0005/receive')
      .set('x-sample-user', 'welfare');
    const repeated = await request(app)
      .post('/welfare/found-items/HZ-0005/receive')
      .set('x-sample-user', 'welfare');

    expect(repeated.status).toBe(409);
    expect(repeated.body).toEqual({ code: 'ALREADY_RECEIVED' });
  });

  it('solo Bienestar puede confirmar', async () => {
    const { repository } = fakeWelfareRepository([pendingItem]);
    const res = await request(createApp({ welfare: repository })).post(
      '/welfare/found-items/HZ-0005/receive',
    );

    expect(res.status).toBe(403);
  });

  it('solo una confirmacion simultanea puede actualizar el objeto', async () => {
    const { repository } = fakeWelfareRepository([pendingItem]);
    const app = createApp({ welfare: repository });
    const responses = await Promise.all([
      request(app)
        .post('/welfare/found-items/HZ-0005/receive')
        .set('x-sample-user', 'welfare'),
      request(app)
        .post('/welfare/found-items/HZ-0005/receive')
        .set('x-sample-user', 'welfare'),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
  });
});
