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

describe('Marcar un aviso como abierto', () => {
  const read = (app: Parameters<typeof request>[0], id: string) =>
    request(app).post(`/me/notifications/${id}/read`).auth('valid-token', { type: 'bearer' });
  const list = (app: Parameters<typeof request>[0]) =>
    request(app).get('/me/notifications').auth('valid-token', { type: 'bearer' });

  it('el aviso abierto deja de estar como nuevo', async () => {
    const { app } = setup();

    const response = await read(app, 'aviso-1');
    const after = await list(app);

    expect(response.status).toBe(204);
    expect(after.body[0].readAt).not.toBeNull();
  });

  it('solo cambia el aviso que abrió', async () => {
    const second = { ...received, id: 'aviso-3', message: 'Otro aviso' };
    const { app } = setup([received, second]);

    await read(app, 'aviso-1');
    const after = await list(app);

    expect(after.body.find(({ id }: { id: string }) => id === 'aviso-3').readAt).toBeNull();
  });

  it('abrirlo otra vez conserva la primera vez que lo abrió', async () => {
    const openedBefore = { ...received, readAt: new Date('2026-11-06T15:00:00.000Z') };
    const { app } = setup([openedBefore]);

    const response = await read(app, 'aviso-1');
    const after = await list(app);

    expect(response.status).toBe(204);
    expect(after.body[0].readAt).toBe('2026-11-06T15:00:00.000Z');
  });

  it('no puede abrir el aviso de otra persona', async () => {
    const { app, notifications } = setup();

    const response = await read(app, 'aviso-2');

    expect(response.status).toBe(404);
    expect(notifications.saved.find(({ id }) => id === 'aviso-2')?.readAt).toBeNull();
  });

  it('informa si el aviso no existe', async () => {
    const { app } = setup();

    const response = await read(app, 'aviso-inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'No encontramos este aviso.' });
  });

  it('pide iniciar sesión para abrir un aviso', async () => {
    const { app } = setup();

    const response = await request(app).post('/me/notifications/aviso-1/read');

    expect(response.status).toBe(401);
  });
});
