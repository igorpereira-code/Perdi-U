import { canUseWelfareOptions } from './canUseWelfareOptions';

describe('Quién ve las opciones de Bienestar', () => {
  it('el personal de Bienestar ve las opciones de Bienestar', () => {
    expect(canUseWelfareOptions('WELFARE')).toBe(true);
  });

  it.each(['COMMUNITY', 'ADMIN'] as const)(
    'un usuario %s no ve las opciones de Bienestar',
    (role) => {
      expect(canUseWelfareOptions(role)).toBe(false);
    },
  );
});
