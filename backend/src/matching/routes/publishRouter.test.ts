import request from 'supertest';
import { createApp } from '../../app';
import { SAMPLE_USERS } from '../../core/sampleUsers';
import { fakeMatchingRepository, type FakeItem } from '../data/fakeMatchingRepository';

const keys: FakeItem = {
  id: 'item-4',
  code: 'HZ-0004',
  status: 'IN_CUSTODY',
  categoryId: 4,
  foundAt: new Date('2026-10-14T12:00:00Z'),
  placeId: 1,
  description: 'Llaves con llavero rojo de la universidad',
  photoUrl: null,
  category: 'Llaves',
};

describe('Publicar un objeto encontrado (POST /found-items/:code/publish)', () => {
  it('no publica un objeto que Bienestar todavía no recibió', async () => {
    const { repository } = fakeMatchingRepository([], [{ ...keys, status: 'PENDING_DROP_OFF' }]);

    const res = await request(createApp({ matching: repository }))
      .post('/found-items/HZ-0004/publish')
      .set('x-sample-user', 'welfare');

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ code: 'NOT_RECEIVED' });
  });

  it('solo deja publicar a Bienestar', async () => {
    const { repository } = fakeMatchingRepository([], [keys]);

    const res = await request(createApp({ matching: repository })).post(
      '/found-items/HZ-0004/publish',
    );

    expect(res.status).toBe(403);
  });

  it('publica un objeto recibido para que la comunidad lo vea', async () => {
    const { repository, items } = fakeMatchingRepository([], [keys]);

    const res = await request(createApp({ matching: repository }))
      .post('/found-items/HZ-0004/publish')
      .set('x-sample-user', 'welfare');

    expect(res.status).toBe(200);
    expect((await repository.listPublishedItems()).map((item) => item.id)).toEqual(['item-4']);
    expect(items[0].publishedById).toBe(SAMPLE_USERS.welfare.id);
  });
});
