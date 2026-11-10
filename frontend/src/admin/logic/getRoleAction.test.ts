import { getRoleAction } from './getRoleAction';

describe('Qué puede hacer el Administrador con el rol de un usuario', () => {
  it('a un miembro de la comunidad le puede asignar el rol de Bienestar', () => {
    expect(getRoleAction('COMMUNITY')).toEqual({
      newRole: 'WELFARE',
      label: 'Asignar Bienestar',
      loadingText: 'Asignando…',
    });
  });

  it('a un Administrador no le puede cambiar el rol', () => {
    expect(getRoleAction('ADMIN')).toBeNull();
  });
});
