import request from 'supertest';
import { createApp } from '../../app';
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

describe('Recibir objetos encontrados en Bienestar', () => {
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
});
