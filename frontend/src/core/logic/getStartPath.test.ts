import { getStartPath } from './getStartPath';

describe('Pantalla de inicio después de ingresar', () => {
  it('el Administrador entra directo a Administración', () => {
    expect(getStartPath('ADMIN')).toBe('/administracion');
  });

  it.each(['COMMUNITY', 'WELFARE'] as const)('un usuario %s entra al inicio', (role) => {
    expect(getStartPath(role)).toBe('/');
  });
});
