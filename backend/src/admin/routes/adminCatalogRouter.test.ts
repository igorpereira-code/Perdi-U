import request from 'supertest';
import type { ManagedCatalogs } from '@shared/admin';
import type { Role } from '@shared/user';
import { createApp } from '../../app';
import type { UsersRepository } from '../../core/data/usersRepository';
import type { AdminCatalogRepository } from '../data/adminCatalogRepository';

const savedCatalogs: ManagedCatalogs = {
  categories: [
    { id: 1, name: 'Llaves', active: true },
    { id: 2, name: 'Paraguas', active: false },
  ],
  places: [
    {
      id: 10,
      name: 'Bloque A',
      type: 'BLOCK',
      active: true,
      classrooms: [{ id: 100, name: 'A-101', active: true }],
    },
    { id: 11, name: 'Biblioteca', type: 'SPACE', active: true, classrooms: [] },
  ],
};

/** An in-memory copy of the catalogs, so one test does not change the next one. */
function createFakeAdminCatalog(catalogs: ManagedCatalogs): AdminCatalogRepository {
  const storedCatalogs: ManagedCatalogs = structuredClone(catalogs);
  return {
    listCatalogs: async () => storedCatalogs,
  };
}

/** Signs in with a user of the given role. */
function setup(signedInRole: Role, adminCatalog: Partial<AdminCatalogRepository> = {}) {
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
    adminCatalog: { ...createFakeAdminCatalog(savedCatalogs), ...adminCatalog },
  });
}

const listCatalogs = (app: ReturnType<typeof createApp>) =>
  request(app).get('/admin/catalogs').auth('token', { type: 'bearer' });

describe('Ver las categorías y los lugares del campus', () => {
  it('el Administrador ve todas las categorías y lugares, también los desactivados', async () => {
    const response = await listCatalogs(setup('ADMIN'));

    expect(response.status).toBe(200);
    expect(response.body).toEqual(savedCatalogs);
  });

  it.each(['COMMUNITY', 'WELFARE'] as const)(
    'un usuario %s no puede ver la lista de administración',
    async (role) => {
      const response = await listCatalogs(setup(role));

      expect(response.status).toBe(403);
    },
  );

  it('informa con un mensaje claro si no se pudieron cargar', async () => {
    const app = setup('ADMIN', {
      listCatalogs: async () => {
        throw new Error('Base no disponible');
      },
    });

    const response = await listCatalogs(app);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: 'No se pudieron cargar las categorías y lugares. Intenta nuevamente.',
    });
  });
});
