import { getStartPath } from './getStartPath';

describe('Pantalla de inicio después de ingresar', () => {
  it('el Administrador entra directo a Administración', () => {
    expect(getStartPath('ADMIN')).toBe('/administracion');
  });

  it('el personal de Bienestar entra directo a Bienestar', () => {
    expect(getStartPath('WELFARE')).toBe('/bienestar');
  });

  it('un usuario de la comunidad entra al inicio', () => {
    expect(getStartPath('COMMUNITY')).toBe('/');
  });
});
