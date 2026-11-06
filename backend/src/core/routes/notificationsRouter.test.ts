import request from 'supertest';
import { createApp } from '../../app';
import type { UsersRepository } from '../data/usersRepository';
import { fakeNotificationsRepository } from '../data/fakeNotificationsRepository';
import type { StoredNotification } from '../data/notificationsRepository';

const ana = {
  id: 'usuario-ana',
  name: 'Ana Rojas',
  email: 'ana@ucb.edu.bo',
  photoUrl: null,
  role: 'COMMUNITY' as const,
  hasSeenGuide: true,
};

const received: StoredNotification = {
  id: 'aviso-1',
  userId: 'usuario-ana',
  message: 'Bienestar recibió tu objeto HZ-0001.',
  link: '/mis-reportes/encontrados/HZ-0001',
  createdAt: new Date('2026-11-06T14:00:00.000Z'),
  readAt: null,
};
const otherUser: StoredNotification = {
  ...received,
  id: 'aviso-2',
  userId: 'usuario-luis',
  message: 'Aviso de otra persona',
};

function setup(saved: StoredNotification[] = [received, otherUser]) {
  const users: UsersRepository = {
    findById: async () => ana,
    create: async (profile) => ({ ...profile, hasSeenGuide: false }),
    listWelfareEmails: async () => [],
    markGuideSeen: async () => undefined,
  };
  const notifications = fakeNotificationsRepository(saved);
  const app = createApp({
    users,
    verifyToken: async (token) => (token === 'valid-token' ? ana : null),
    allowSampleUsers: false,
    notifications,
  });
  return { app, notifications };
}

describe('Ver mis avisos', () => {
  it('muestra solo los avisos del usuario de la sesión', async () => {
    const { app } = setup();

    const response = await request(app)
      .get('/me/notifications')
      .auth('valid-token', { type: 'bearer' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: 'aviso-1',
        message: 'Bienestar recibió tu objeto HZ-0001.',
        link: '/mis-reportes/encontrados/HZ-0001',
        createdAt: '2026-11-06T14:00:00.000Z',
        readAt: null,
      },
    ]);
  });
  it('muestra los avisos del más reciente al más antiguo', async () => {
    const older = {
      ...received,
      id: 'aviso-antiguo',
      createdAt: new Date('2026-11-01T09:00:00.000Z'),
    };
    const newer = {
      ...received,
      id: 'aviso-nuevo',
      createdAt: new Date('2026-11-06T18:00:00.000Z'),
    };
    const { app } = setup([older, received, newer]);

    const response = await request(app)
      .get('/me/notifications')
      .auth('valid-token', { type: 'bearer' });

    expect(response.body.map(({ id }: { id: string }) => id)).toEqual([
      'aviso-nuevo',
      'aviso-1',
      'aviso-antiguo',
    ]);
  });

  it('muestra una lista vacía si todavía no tiene avisos', async () => {
    const { app } = setup([]);

    const response = await request(app)
      .get('/me/notifications')
      .auth('valid-token', { type: 'bearer' });

    expect(response.body).toEqual([]);
  });

  it('pide iniciar sesión para ver los avisos', async () => {
    const { app } = setup();

    const response = await request(app).get('/me/notifications');

    expect(response.status).toBe(401);
  });

  it('informa con un mensaje claro si no se pudieron cargar', async () => {
    const { app, notifications } = setup();
    notifications.listForUser = async () => {
      throw new Error('Base no disponible');
    };

    const response = await request(app)
      .get('/me/notifications')
      .auth('valid-token', { type: 'bearer' });

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: 'No se pudieron cargar tus avisos. Intenta nuevamente.',
    });
  });
});

describe('Crear avisos para un usuario', () => {
  it('el aviso creado aparece en la lista de su destinatario', async () => {
    const { app, notifications } = setup([]);

    await notifications.notify({
      userId: 'usuario-ana',
      message: 'Hay un objeto parecido al tuyo.',
      link: '/mis-perdidas/PR-0001',
    });
    const response = await request(app)
      .get('/me/notifications')
      .auth('valid-token', { type: 'bearer' });

    expect(response.body).toEqual([
      expect.objectContaining({
        message: 'Hay un objeto parecido al tuyo.',
        link: '/mis-perdidas/PR-0001',
        readAt: null,
      }),
    ]);
  });
});
