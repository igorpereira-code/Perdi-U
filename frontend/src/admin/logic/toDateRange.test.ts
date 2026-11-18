import { toDateRange } from './toDateRange';

describe('Rango que se pide al backend', () => {
  it('sin fechas, no hay rango: se cuenta todo', () => {
    expect(toDateRange('', '')).toBeUndefined();
  });

  it('con las dos fechas, pide ese rango', () => {
    expect(toDateRange('2026-11-01', '2026-11-30')).toEqual({
      from: '2026-11-01',
      to: '2026-11-30',
    });
  });
});
