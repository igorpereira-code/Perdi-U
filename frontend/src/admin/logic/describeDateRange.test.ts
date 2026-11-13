import { describeDateRange } from './describeDateRange';

describe('Rango de las estadísticas en palabras', () => {
  it('sin rango, cuenta desde que empezó Perdi-U', () => {
    expect(describeDateRange()).toBe('Desde que empezó Perdi-U');
  });

  it('muestra el primer y el último día', () => {
    expect(describeDateRange({ from: '2026-11-01', to: '2026-11-30' })).toBe(
      'Del 1 nov. 2026 al 30 nov. 2026',
    );
  });

  it('si es un solo día, lo dice una vez', () => {
    expect(describeDateRange({ from: '2026-11-12', to: '2026-11-12' })).toBe('El 12 nov. 2026');
  });
});
