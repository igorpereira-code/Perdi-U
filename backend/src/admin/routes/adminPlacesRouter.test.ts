import request from 'supertest';
import type { ManagedCatalogs } from '@shared/admin';
import type { Role } from '@shared/user';
import { createApp } from '../../app';
import type { UsersRepository } from '../../core/data/usersRepository';
import type { AdminCatalogRepository } from '../data/adminCatalogRepository';
import { fakeAdminCatalogRepository } from '../data/fakeAdminCatalogRepository';

const savedCatalogs: ManagedCatalogs = {
  categories: [],
  places: [
    {
      id: 10,
      name: 'Bloque A',
      type: 'BLOCK',
      active: true,
      classrooms: [
        { id: 100, name: 'A-101', active: true },
        { id: 101, name: 'A-102', active: false },
      ],
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

type TestApp = ReturnType<typeof createApp>;

const send = (app: TestApp, method: 'post' | 'patch', path: string, body: object) =>
  request(app)[method](path).auth('token', { type: 'bearer' }).send(body);

const listPlaces = async (app: TestApp) =>
  (await request(app).get('/admin/catalogs').auth('token', { type: 'bearer' })).body.places;

describe('Crear un bloque o un espacio', () => {
  it('el Administrador crea un bloque, activo y todavía sin aulas', async () => {
    const app = setup('ADMIN');

    const response = await send(app, 'post', '/admin/places', { name: 'Bloque C', type: 'BLOCK' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 50,
      name: 'Bloque C',
      type: 'BLOCK',
      active: true,
      classrooms: [],
    });
    expect(await listPlaces(app)).toContainEqual(response.body);
  });

  it('el Administrador crea un espacio', async () => {
    const response = await send(setup('ADMIN'), 'post', '/admin/places', {
      name: '  Cafetería   central ',
      type: 'SPACE',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: 'Cafetería central', type: 'SPACE' });
  });

  it('pide elegir si es un bloque o un espacio', async () => {
    const response = await send(setup('ADMIN'), 'post', '/admin/places', { name: 'Bloque C' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Elige si es un bloque o un espacio.' });
  });

  it('pide escribir un nombre si está vacío', async () => {
    const response = await send(setup('ADMIN'), 'post', '/admin/places', {
      name: ' ',
      type: 'BLOCK',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Escribe un nombre.' });
  });

  it('no deja crear un lugar con un nombre que ya existe', async () => {
    const response = await send(setup('ADMIN'), 'post', '/admin/places', {
      name: 'bloque a',
      type: 'BLOCK',
    });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Ya existe un lugar con ese nombre.' });
  });

  it('informa con un mensaje claro si no se pudo guardar', async () => {
    const app = setup('ADMIN', {
      createPlace: async () => {
        throw new Error('Base no disponible');
      },
    });

    const response = await send(app, 'post', '/admin/places', { name: 'Bloque C', type: 'BLOCK' });

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'No se pudo guardar el lugar. Intenta nuevamente.' });
  });
});

describe('Editar y desactivar un lugar', () => {
  it('el Administrador cambia el nombre de un lugar', async () => {
    const response = await send(setup('ADMIN'), 'patch', '/admin/places/11', {
      name: 'Biblioteca central',
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: 11, name: 'Biblioteca central' });
  });

  it('el Administrador desactiva un lugar y luego lo vuelve a activar', async () => {
    const app = setup('ADMIN');

    const deactivated = await send(app, 'patch', '/admin/places/10', { active: false });
    const activated = await send(app, 'patch', '/admin/places/10', { active: true });

    expect(deactivated.body).toMatchObject({ id: 10, active: false });
    expect(activated.body).toMatchObject({ id: 10, active: true });
  });

  it('no deja usar el nombre de otro lugar', async () => {
    const response = await send(setup('ADMIN'), 'patch', '/admin/places/11', {
      name: 'Bloque A',
    });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Ya existe un lugar con ese nombre.' });
  });

  it('avisa si el lugar no existe', async () => {
    const response = await send(setup('ADMIN'), 'patch', '/admin/places/404', { active: false });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'No encontramos este lugar.' });
  });
});

describe('Aulas de un bloque', () => {
  it('el Administrador agrega un aula a un bloque', async () => {
    const app = setup('ADMIN');

    const response = await send(app, 'post', '/admin/places/10/classrooms', { name: 'A-103' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 500, name: 'A-103', active: true });
    expect((await listPlaces(app))[0].classrooms).toContainEqual(response.body);
  });

  it('un espacio no puede tener aulas', async () => {
    const response = await send(setup('ADMIN'), 'post', '/admin/places/11/classrooms', {
      name: 'Sala 1',
    });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Solo los bloques tienen aulas.' });
  });

  it('no deja repetir el nombre de un aula en el mismo bloque', async () => {
    const response = await send(setup('ADMIN'), 'post', '/admin/places/10/classrooms', {
      name: 'a-101',
    });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Este bloque ya tiene un aula con ese nombre.' });
  });

  it('el Administrador cambia el nombre de un aula', async () => {
    const response = await send(setup('ADMIN'), 'patch', '/admin/classrooms/100', {
      name: 'A-101 (laboratorio)',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 100, name: 'A-101 (laboratorio)', active: true });
  });

  it('el Administrador desactiva un aula y vuelve a activar otra', async () => {
    const app = setup('ADMIN');

    const deactivated = await send(app, 'patch', '/admin/classrooms/100', { active: false });
    const activated = await send(app, 'patch', '/admin/classrooms/101', { active: true });

    expect(deactivated.body).toEqual({ id: 100, name: 'A-101', active: false });
    expect(activated.body).toEqual({ id: 101, name: 'A-102', active: true });
  });

  it('no deja usar el nombre de otra aula del mismo bloque', async () => {
    const response = await send(setup('ADMIN'), 'patch', '/admin/classrooms/100', {
      name: 'A-102',
    });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Este bloque ya tiene un aula con ese nombre.' });
  });

  it('avisa si el aula no existe', async () => {
    const response = await send(setup('ADMIN'), 'patch', '/admin/classrooms/404', {
      active: false,
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'No encontramos esta aula.' });
  });
});

describe('Solo el Administrador gestiona los lugares', () => {
  it.each([
    ['post', '/admin/places', { name: 'Bloque C', type: 'BLOCK' }],
    ['patch', '/admin/places/10', { active: false }],
    ['post', '/admin/places/10/classrooms', { name: 'A-103' }],
    ['patch', '/admin/classrooms/100', { active: false }],
  ] as const)('un usuario de la comunidad no puede usar %s %s', async (method, path, body) => {
    const response = await send(setup('COMMUNITY'), method, path, body);

    expect(response.status).toBe(403);
  });
});
