import { readDateRange } from './readDateRange';

describe('Leer el rango de fechas de las estadísticas', () => {
  it('sin fechas, cuenta todo', () => {
    expect(readDateRange({})).toEqual({});
  });

  it('lee la fecha de inicio y la de fin', () => {
    expect(readDateRange({ from: '2026-11-01', to: '2026-11-30' })).toEqual({
      range: { from: '2026-11-01', to: '2026-11-30' },
    });
  });

  it('acepta un rango de un solo día', () => {
    expect(readDateRange({ from: '2026-11-12', to: '2026-11-12' })).toEqual({
      range: { from: '2026-11-12', to: '2026-11-12' },
    });
  });

  it('pide las dos fechas si falta una', () => {
    expect(readDateRange({ from: '2026-11-01' })).toEqual({
      error: 'Elige la fecha de inicio y la de fin.',
    });
  });

  it.each(['12/11/2026', '2026-02-30', 'ayer'])('rechaza la fecha "%s"', (from) => {
    expect(readDateRange({ from, to: '2026-11-30' })).toEqual({ error: 'La fecha no es válida.' });
  });

  it('no deja que la fecha de inicio sea posterior a la de fin', () => {
    expect(readDateRange({ from: '2026-11-30', to: '2026-11-01' })).toEqual({
      error: 'La fecha de inicio no puede ser posterior a la de fin.',
    });
  });
});
