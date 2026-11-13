import type { ManagedUser } from '@shared/admin';
import { filterUsersByEmail } from './filterUsersByEmail';

const ana: ManagedUser = {
  id: 'usuario-ana',
  name: 'Ana Rojas',
  email: 'ana.rojas@ucb.edu.bo',
  role: 'COMMUNITY',
};
const luis: ManagedUser = {
  id: 'usuario-luis',
  name: 'Luis Mamani',
  email: 'luis.mamani@ucb.edu.bo',
  role: 'WELFARE',
};
const users = [ana, luis];

describe('Buscar un usuario por su correo', () => {
  it('encuentra al usuario con el correo completo', () => {
    expect(filterUsersByEmail(users, 'luis.mamani@ucb.edu.bo')).toEqual([luis]);
  });

  it('encuentra al usuario con una parte del correo', () => {
    expect(filterUsersByEmail(users, 'ana.ro')).toEqual([ana]);
  });

  it('no importan las mayúsculas ni los espacios de más', () => {
    expect(filterUsersByEmail(users, '  LUIS.Mamani ')).toEqual([luis]);
  });

  it('muestra a todos los usuarios si no escribió nada', () => {
    expect(filterUsersByEmail(users, '')).toEqual([ana, luis]);
  });

  it('no muestra a nadie si ningún correo coincide', () => {
    expect(filterUsersByEmail(users, 'pedro@ucb.edu.bo')).toEqual([]);
  });
});
