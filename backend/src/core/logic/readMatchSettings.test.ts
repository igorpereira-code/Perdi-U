import { readMatchSettings } from './readMatchSettings';

describe('Leer el nivel mínimo de similitud', () => {
  it.each([0, 55, 100])('acepta el nivel %i', (minSimilarity) => {
    expect(readMatchSettings({ minSimilarity })).toEqual({ matchSettings: { minSimilarity } });
  });

  it.each([
    ['menor que 0', -1],
    ['mayor que 100', 101],
    ['con decimales', 40.5],
    ['escrito como texto', '60'],
    ['vacío', undefined],
  ])('rechaza un nivel %s', (_description, minSimilarity) => {
    expect(readMatchSettings({ minSimilarity })).toEqual({
      error: 'El nivel mínimo debe ser un número entero entre 0 y 100.',
    });
  });
});
