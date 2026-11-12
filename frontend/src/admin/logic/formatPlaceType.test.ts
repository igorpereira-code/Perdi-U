import { formatPlaceType } from './formatPlaceType';

describe('Tipo de lugar', () => {
  it.each([
    ['BLOCK', 'Bloque'],
    ['SPACE', 'Espacio'],
  ] as const)('muestra el tipo %s como "%s"', (type, label) => {
    expect(formatPlaceType(type)).toBe(label);
  });
});
