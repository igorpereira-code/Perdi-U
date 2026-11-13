import { getDateRangeError } from './getDateRangeError';

describe('Revisar el rango de fechas elegido', () => {
  it('sin fechas está bien: se cuenta todo', () => {
    expect(getDateRangeError('', '')).toBeNull();
  });

  it('acepta un rango con inicio antes del fin', () => {
    expect(getDateRangeError('2026-11-01', '2026-11-30')).toBeNull();
  });

  it('acepta un rango de un solo día', () => {
    expect(getDateRangeError('2026-11-12', '2026-11-12')).toBeNull();
  });

  it.each([
    ['2026-11-01', ''],
    ['', '2026-11-30'],
  ])('pide las dos fechas si falta una (%s – %s)', (from, to) => {
    expect(getDateRangeError(from, to)).toBe('Elige la fecha de inicio y la de fin.');
  });

  it('avisa si la fecha de inicio es posterior a la de fin', () => {
    expect(getDateRangeError('2026-11-30', '2026-11-01')).toBe(
      'La fecha de inicio no puede ser posterior a la de fin.',
    );
  });
});
