import { canManageUsers } from './canManageUsers';

describe('Quién puede administrar a los usuarios', () => {
  it('el Administrador puede administrar a los usuarios', () => {
    expect(canManageUsers('ADMIN')).toBe(true);
  });

  it.each(['COMMUNITY', 'WELFARE'] as const)(
    'un usuario %s no puede administrar a los usuarios',
    (role) => {
      expect(canManageUsers(role)).toBe(false);
    },
  );
});
