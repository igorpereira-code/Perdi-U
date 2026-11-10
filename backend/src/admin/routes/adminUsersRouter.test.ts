import request from 'supertest';
import type { ManagedUser } from '@shared/admin';
import type { Role } from '@shared/user';
import { createApp } from '../../app';
import type { UsersRepository } from '../../core/data/usersRepository';
import type { AdminUsersRepository } from '../data/adminUsersRepository';

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

/** Signs in with a user of the given role. */
function setup(signedInRole: Role, adminUsers: Partial<AdminUsersRepository> = {}) {
  const signedInUser = {
    id: 'usuario-sesion',
    name: 'Igor Pereira',
    email: 'igor.pereira@ucb.edu.bo',
    photoUrl: null,
    role: signedInRole,
    hasSeenGuide: true,
  };
  const users: UsersRepository = {
    findById: async () => signedInUser,
    create: async (profile) => ({ ...profile, hasSeenGuide: false }),
    listWelfareEmails: async () => [],
    markGuideSeen: async () => undefined,
  };
  return createApp({
    users,
    verifyToken: async () => signedInUser,
    allowSampleUsers: false,
    adminUsers: { listUsers: async () => [ana, luis], ...adminUsers },
  });
}

const listUsers = (app: ReturnType<typeof createApp>) =>
  request(app).get('/admin/users').auth('token', { type: 'bearer' });

describe('Ver la lista de usuarios', () => {
  it('el Administrador ve a los usuarios con su nombre, correo y rol', async () => {
    const response = await listUsers(setup('ADMIN'));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([ana, luis]);
  });

  it.each(['COMMUNITY', 'WELFARE'] as const)(
    'un usuario %s no puede ver la lista',
    async (role) => {
      const response = await listUsers(setup(role));

      expect(response.status).toBe(403);
    },
  );

  it('informa con un mensaje claro si no se pudo cargar la lista', async () => {
    const app = setup('ADMIN', {
      listUsers: async () => {
        throw new Error('Base no disponible');
      },
    });

    const response = await listUsers(app);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: 'No se pudieron cargar los usuarios. Intenta nuevamente.',
    });
  });
});
