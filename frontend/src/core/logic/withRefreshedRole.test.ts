import type { AppUser } from '@shared/user';
import { withRefreshedRole } from './withRefreshedRole';

const luis: AppUser = {
  id: 'usuario-luis',
  name: 'Luis Mamani',
  email: 'luis.mamani@ucb.edu.bo',
  role: 'WELFARE',
  hasSeenGuide: true,
};

describe('Rol actualizado del usuario que inició sesión', () => {
  it('si le quitaron el rol de Bienestar, deja de tenerlo', () => {
    const refreshedLuis: AppUser = { ...luis, role: 'COMMUNITY' };

    expect(withRefreshedRole(luis, refreshedLuis).role).toBe('COMMUNITY');
  });

  it('si le dieron el rol de Bienestar, lo tiene', () => {
    const communityLuis: AppUser = { ...luis, role: 'COMMUNITY' };

    expect(withRefreshedRole(communityLuis, luis).role).toBe('WELFARE');
  });

  it('conserva el resto de sus datos', () => {
    const refreshedLuis: AppUser = { ...luis, role: 'COMMUNITY', hasSeenGuide: false };

    expect(withRefreshedRole(luis, refreshedLuis)).toEqual({ ...luis, role: 'COMMUNITY' });
  });

  it('no cambia nada si no se pudo consultar su rol', () => {
    expect(withRefreshedRole(luis, null)).toBe(luis);
  });
});
