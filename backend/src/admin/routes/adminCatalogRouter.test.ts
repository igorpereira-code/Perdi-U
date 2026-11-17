import request from 'supertest';
import type { ManagedCatalogs } from '@shared/admin';
import type { Role } from '@shared/user';
import { createApp } from '../../app';
import type { UsersRepository } from '../../core/data/usersRepository';
import type { AdminCatalogRepository } from '../data/adminCatalogRepository';
import { fakeAdminCatalogRepository } from '../data/fakeAdminCatalogRepository';

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
    adminCatalog: { ...fakeAdminCatalogRepository(savedCatalogs), ...adminCatalog },
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

const createCategory = (app: ReturnType<typeof createApp>, name: unknown) =>
  request(app).post('/admin/categories').auth('token', { type: 'bearer' }).send({ name });

describe('Crear una categoría', () => {
  it('el Administrador crea una categoría, que queda activa en la lista', async () => {
    const app = setup('ADMIN');

    const response = await createCategory(app, 'Audífonos');
    const catalogsAfter = await listCatalogs(app);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 99, name: 'Audífonos', active: true });
    expect(catalogsAfter.body.categories).toContainEqual({
      id: 99,
      name: 'Audífonos',
      active: true,
    });
  });

  it('guarda el nombre sin espacios de más', async () => {
    const response = await createCategory(setup('ADMIN'), '  Cargadores   de celular ');

    expect(response.body.name).toBe('Cargadores de celular');
  });

  it('pide escribir un nombre si está vacío', async () => {
    const response = await createCategory(setup('ADMIN'), '   ');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Escribe un nombre.' });
  });

  it('no deja crear una categoría con un nombre que ya existe', async () => {
    const response = await createCategory(setup('ADMIN'), 'llaves');

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Ya existe una categoría con ese nombre.' });
  });

  it.each(['COMMUNITY', 'WELFARE'] as const)(
    'un usuario %s no puede crear categorías',
    async (role) => {
      const response = await createCategory(setup(role), 'Audífonos');

      expect(response.status).toBe(403);
    },
  );

  it('informa con un mensaje claro si no se pudo guardar', async () => {
    const app = setup('ADMIN', {
      createCategory: async () => {
        throw new Error('Base no disponible');
      },
    });

    const response = await createCategory(app, 'Audífonos');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: 'No se pudo guardar la categoría. Intenta nuevamente.',
    });
  });
});

const updateCategory = (app: ReturnType<typeof createApp>, categoryId: number, changes: object) =>
  request(app)
    .patch(`/admin/categories/${categoryId}`)
    .auth('token', { type: 'bearer' })
    .send(changes);

describe('Editar una categoría', () => {
  it('el Administrador cambia el nombre de una categoría', async () => {
    const app = setup('ADMIN');

    const response = await updateCategory(app, 1, { name: 'Llaves y llaveros' });
    const catalogsAfter = await listCatalogs(app);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1, name: 'Llaves y llaveros', active: true });
    expect(catalogsAfter.body.categories).toContainEqual(response.body);
  });

  it('puede corregir las mayúsculas de su propio nombre', async () => {
    const response = await updateCategory(setup('ADMIN'), 1, { name: 'LLAVES' });

    expect(response.status).toBe(200);
  });

  it('no deja usar el nombre de otra categoría', async () => {
    const response = await updateCategory(setup('ADMIN'), 1, { name: 'Paraguas' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Ya existe una categoría con ese nombre.' });
  });

  it('avisa si la categoría no existe', async () => {
    const response = await updateCategory(setup('ADMIN'), 404, { name: 'Libros' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'No encontramos esta categoría.' });
  });

  it('avisa si no se envió ningún cambio', async () => {
    const response = await updateCategory(setup('ADMIN'), 1, {});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'No hay cambios para guardar.' });
  });

  it.each(['COMMUNITY', 'WELFARE'] as const)(
    'un usuario %s no puede editar categorías',
    async (role) => {
      const response = await updateCategory(setup(role), 1, { name: 'Libros' });

      expect(response.status).toBe(403);
    },
  );
});

describe('Desactivar y volver a activar una categoría', () => {
  it('el Administrador desactiva una categoría', async () => {
    const response = await updateCategory(setup('ADMIN'), 1, { active: false });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1, name: 'Llaves', active: false });
  });

  it('el Administrador vuelve a activar una categoría desactivada', async () => {
    const response = await updateCategory(setup('ADMIN'), 2, { active: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 2, name: 'Paraguas', active: true });
  });
});
