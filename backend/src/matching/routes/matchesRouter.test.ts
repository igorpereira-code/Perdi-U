import request from 'supertest';
import { createApp } from '../../app';
import { SAMPLE_USERS } from '../../core/sampleUsers';
import {
  fakeMatchingRepository,
  type FakeItem,
  type FakeReport,
} from '../data/fakeMatchingRepository';

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
  it('muestra los objetos publicados parecidos, del más parecido al menos parecido', async () => {
    const { repository } = fakeMatchingRepository([anasReport], items);

    const res = await request(createApp({ matching: repository })).get(
      '/lost-reports/PR-0001/matches',
    );

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

    const res = await request(createApp({ matching: repository })).get(
      '/lost-reports/PR-0001/matches',
    );

    expect(res.status).toBe(404);
  });
});
