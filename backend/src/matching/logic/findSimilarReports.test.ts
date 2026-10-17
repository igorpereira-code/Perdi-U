import { findSimilarReports } from './findSimilarReports';

const keys = {
  categoryId: 4,
  foundAt: new Date('2026-10-14T12:00:00Z'),
  placeId: 1,
  description: 'Llaves con llavero rojo de la universidad',
};

const lostOn = { dateFrom: new Date('2026-10-13'), dateTo: new Date('2026-10-14') };

describe('Buscar reportes de pérdida parecidos a un objeto encontrado', () => {
  it('devuelve solo los reportes parecidos, del más parecido al menos parecido', () => {
    const reports = [
      { id: 'almost', categoryId: 4, ...lostOn, placeIds: [9], description: 'Perdí unas llaves' },
      {
        id: 'same',
        categoryId: 4,
        ...lostOn,
        placeIds: [1],
        description: 'Llaves de mi casa con llavero rojo',
      },
      { id: 'other-category', categoryId: 1, ...lostOn, placeIds: [1], description: 'Celular' },
    ];

    const similar = findSimilarReports(keys, reports);

    expect(similar.map((match) => match.report.id)).toEqual(['same', 'almost']);
  });
});
