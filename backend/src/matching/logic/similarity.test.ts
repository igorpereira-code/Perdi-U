import {
  similarityScore,
  type FoundItemForMatching,
  type LostReportForMatching,
} from './similarity';

const lostPhone: LostReportForMatching = {
  categoryId: 1,
  dateFrom: new Date('2026-10-10'),
  dateTo: new Date('2026-10-11'),
  placeIds: [5],
  description: 'Perdí mi celular Samsung, tiene funda azul',
};

const foundItem: FoundItemForMatching = {
  categoryId: 1,
  foundAt: new Date('2026-10-11T15:00:00Z'),
  placeId: 9,
  description: 'Objeto encontrado',
};

describe('Qué tan parecido es un objeto encontrado a un reporte de pérdida', () => {
  it('suma 40 si se encontró dentro de las fechas en que se perdió', () => {
    expect(similarityScore(lostPhone, foundItem)).toBe(40);
  });

  it('no es parecido si es de otra categoría', () => {
    expect(similarityScore(lostPhone, { ...foundItem, categoryId: 2 })).toBe(0);
  });

  it('suma 30 si se encontró en uno de los lugares donde pudo perderse', () => {
    expect(similarityScore(lostPhone, { ...foundItem, placeId: 5 })).toBe(70);
  });

  it('suma 10 por cada palabra en común en la descripción, hasta 30', () => {
    const foundBefore = new Date('2026-10-01');

    expect(
      similarityScore(lostPhone, {
        ...foundItem,
        foundAt: foundBefore,
        description: 'Celular Samsung Galaxy con funda azul',
      }),
    ).toBe(30);
    expect(
      similarityScore(
        { ...lostPhone, description: 'Mi cuaderno de Cálculo' },
        { ...foundItem, foundAt: foundBefore, description: 'CUADERNO con apuntes de calculo' },
      ),
    ).toBe(20);
  });
});
