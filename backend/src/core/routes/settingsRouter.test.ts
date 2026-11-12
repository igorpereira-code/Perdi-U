import request from 'supertest';
import type { Role } from '@shared/user';
import { createApp } from '../../app';
import { fakeSettingsRepository } from '../data/fakeSettingsRepository';
import type { SettingsRepository } from '../data/settingsRepository';
import type { UsersRepository } from '../data/usersRepository';

/** Signs in with a user of the given role. */
function setup(signedInRole: Role, settings: Partial<SettingsRepository> = {}) {
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
    settings: { ...fakeSettingsRepository(), ...settings },
  });
}

type TestApp = ReturnType<typeof createApp>;

const getWelfareOffice = (app: TestApp) =>
  request(app).get('/welfare-office').auth('token', { type: 'bearer' });

const updateWelfareOffice = (app: TestApp, body: object) =>
  request(app).put('/admin/welfare-office').auth('token', { type: 'bearer' }).send(body);

const NEW_WELFARE_OFFICE = {
  place: 'Bienestar Estudiantil – Bloque D, planta baja',
  hours: 'Lunes a viernes, de 08:00 a 17:00',
};

describe('Editar la ubicación y el horario de Bienestar', () => {
  it('el Administrador ve la ubicación y el horario actuales', async () => {
    const response = await getWelfareOffice(setup('ADMIN'));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      place: 'Bienestar Estudiantil – Bloque C',
      hours: 'Lunes a viernes, de 08:30 a 16:00',
    });
  });

  it('el Administrador guarda una nueva ubicación y un nuevo horario', async () => {
    const app = setup('ADMIN');

    const response = await updateWelfareOffice(app, NEW_WELFARE_OFFICE);
    const afterSaving = await getWelfareOffice(app);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(NEW_WELFARE_OFFICE);
    expect(afterSaving.body).toEqual(NEW_WELFARE_OFFICE);
  });

  it('no guarda si falta la ubicación o el horario', async () => {
    const response = await updateWelfareOffice(setup('ADMIN'), { place: 'Bloque D' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Escribe el horario.' });
  });

  it.each(['COMMUNITY', 'WELFARE'] as const)(
    'un usuario %s no puede cambiar la ubicación ni el horario',
    async (role) => {
      const response = await updateWelfareOffice(setup(role), NEW_WELFARE_OFFICE);

      expect(response.status).toBe(403);
    },
  );

  it('informa con un mensaje claro si no se pudo guardar', async () => {
    const app = setup('ADMIN', {
      updateWelfareOffice: async () => {
        throw new Error('Base no disponible');
      },
    });

    const response = await updateWelfareOffice(app, NEW_WELFARE_OFFICE);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: 'No se pudo guardar la ubicación de Bienestar. Intenta nuevamente.',
    });
  });

  it('informa con un mensaje claro si no se pudo cargar', async () => {
    const app = setup('ADMIN', {
      getWelfareOffice: async () => {
        throw new Error('Base no disponible');
      },
    });

    const response = await getWelfareOffice(app);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: 'No se pudo cargar la ubicación de Bienestar. Intenta nuevamente.',
    });
  });
});
