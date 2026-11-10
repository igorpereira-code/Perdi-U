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

/** An in-memory copy of the users, so one test does not change the next one. */
function createFakeAdminUsers(savedUsers: ManagedUser[]): AdminUsersRepository {
  const storedUsers = savedUsers.map((user) => ({ ...user }));
  return {
    listUsers: async () => storedUsers,
    findUser: async (userId) => storedUsers.find((user) => user.id === userId) ?? null,
    changeRole: async (userId, newRole) => {
      const user = storedUsers.find((storedUser) => storedUser.id === userId);
      if (!user) {
        throw new Error(`Unknown user ${userId}`);
      }
      user.role = newRole;
      return user;
    },
  };
}

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
    adminUsers: { ...createFakeAdminUsers([ana, luis]), ...adminUsers },
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

const changeRole = (app: ReturnType<typeof createApp>, userId: string, role: unknown) =>
  request(app)
    .patch(`/admin/users/${userId}/role`)
    .auth('token', { type: 'bearer' })
    .send({ role });

describe('Asignar el rol de Bienestar', () => {
  it('el Administrador da el rol de Bienestar a un miembro de la comunidad', async () => {
    const app = setup('ADMIN');

    const response = await changeRole(app, 'usuario-ana', 'WELFARE');
    const usersAfter = await listUsers(app);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...ana, role: 'WELFARE' });
    expect(usersAfter.body).toContainEqual({ ...ana, role: 'WELFARE' });
  });

  it.each(['COMMUNITY', 'WELFARE'] as const)(
    'un usuario %s no puede cambiar roles',
    async (role) => {
      const response = await changeRole(setup(role), 'usuario-ana', 'WELFARE');

      expect(response.status).toBe(403);
    },
  );

  it('informa si el usuario no existe', async () => {
    const response = await changeRole(setup('ADMIN'), 'usuario-inexistente', 'WELFARE');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'No encontramos a este usuario.' });
  });

  it('no deja dar el rol de Administrador', async () => {
    const response = await changeRole(setup('ADMIN'), 'usuario-ana', 'ADMIN');

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'No se puede hacer este cambio de rol.' });
  });

  it('no acepta un rol que no existe', async () => {
    const response = await changeRole(setup('ADMIN'), 'usuario-ana', 'JEFE');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'El rol no es válido.' });
  });
  describe('Quitar el rol de Bienestar', () => {
    it('el Administrador le quita el rol de Bienestar a un usuario', async () => {
      const app = setup('ADMIN');

      const response = await changeRole(app, 'usuario-luis', 'COMMUNITY');
      const usersAfter = await listUsers(app);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ...luis, role: 'COMMUNITY' });
      expect(usersAfter.body).toContainEqual({ ...luis, role: 'COMMUNITY' });
    });

    it('no se puede quitar el rol de Bienestar a quien no lo tiene', async () => {
      const response = await changeRole(setup('ADMIN'), 'usuario-ana', 'COMMUNITY');

      expect(response.status).toBe(409);
    });
  });
});
