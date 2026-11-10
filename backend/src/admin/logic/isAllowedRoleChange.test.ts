import { isAllowedRoleChange } from './isAllowedRoleChange';

describe('Cambios de rol permitidos', () => {
  it('se puede dar el rol de Bienestar a un miembro de la comunidad', () => {
    expect(isAllowedRoleChange('COMMUNITY', 'WELFARE')).toBe(true);
  });

  it('no se puede cambiar el rol de un Administrador', () => {
    expect(isAllowedRoleChange('ADMIN', 'WELFARE')).toBe(false);
  });

  it('no se puede dar el rol de Administrador', () => {
    expect(isAllowedRoleChange('COMMUNITY', 'ADMIN')).toBe(false);
  });

  it('no se puede dar el rol de Bienestar a quien ya lo tiene', () => {
    expect(isAllowedRoleChange('WELFARE', 'WELFARE')).toBe(false);
  });
});
