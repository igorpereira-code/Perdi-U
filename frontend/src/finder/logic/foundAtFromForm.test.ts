import { foundAtFromForm } from './foundAtFromForm';

describe('Fecha del hallazgo en America/La_Paz', () => {
  it('usa 00:00 UTC−4 como convención técnica si no se indicó una hora', () => {
    expect(foundAtFromForm('2026-10-19', '')).toBe('2026-10-19T04:00:00.000Z');
  });

  it.each([
    ['2026-10-19', '08:15', '2026-10-19T12:15:00.000Z'],
    ['2026-10-19', '23:45', '2026-10-20T03:45:00.000Z'],
    ['2024-02-29', '00:00', '2024-02-29T04:00:00.000Z'],
  ])('conserva exactamente %s a las %s al convertir a UTC', (date, time, expected) => {
    expect(foundAtFromForm(date, time)).toBe(expected);
  });

  it.each([['2026-02-30', '08:15'], ['2026-10-19', '25:00'], ['', '']])
    ('rechaza fecha u hora inválida sin normalizarla: %s %s', (date, time) => {
      expect(() => foundAtFromForm(date, time)).toThrow('Indica una fecha y hora válidas.');
    });
});
