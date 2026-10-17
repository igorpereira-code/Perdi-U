import { matchCountText } from './matchCountText';

describe('Texto de cuántos reportes se parecen', () => {
  it('lo dice en singular, en plural o avisa que no hay ninguno', () => {
    expect(matchCountText(0)).toBe('Por ahora ningún reporte de pérdida se parece a este objeto.');
    expect(matchCountText(1)).toBe('1 reporte de pérdida se parece a este objeto.');
    expect(matchCountText(3)).toBe('3 reportes de pérdida se parecen a este objeto.');
  });
});
