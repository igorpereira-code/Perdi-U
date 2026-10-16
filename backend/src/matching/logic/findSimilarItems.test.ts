import { findSimilarItems } from './findSimilarItems';

const lostPhone = {
  categoryId: 1,
  dateFrom: new Date('2026-10-10'),
  dateTo: new Date('2026-10-11'),
  placeIds: [5],
  description: 'Perdí mi celular Samsung, tiene funda azul',
};

const inDates = new Date('2026-10-11T15:00:00Z');
const outOfDates = new Date('2026-10-01');

describe('Buscar objetos parecidos a un reporte de pérdida', () => {
  it('devuelve solo los parecidos, del más parecido al menos parecido', () => {
    const items = [
      { id: 'almost', categoryId: 1, foundAt: inDates, placeId: 9, description: 'Celular negro' },
      {
        id: 'same',
        categoryId: 1,
        foundAt: inDates,
        placeId: 5,
        description: 'Celular Samsung con funda azul',
      },
      {
        id: 'other-category',
        categoryId: 2,
        foundAt: inDates,
        placeId: 5,
        description: 'Funda azul',
      },
      {
        id: 'too-different',
        categoryId: 1,
        foundAt: outOfDates,
        placeId: 9,
        description: 'Tablet',
      },
    ];

    const similar = findSimilarItems(lostPhone, items);

    expect(similar.map((match) => match.item.id)).toEqual(['same', 'almost']);
    expect(similar[0].similarity).toBe(100);
  });
});
