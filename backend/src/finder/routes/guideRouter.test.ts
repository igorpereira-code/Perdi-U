import request from 'supertest';
import { createApp } from '../../app';
import type { UsersRepository } from '../../core/data/usersRepository';

const profile = {
  id: 'usuario-1',
  name: 'Ana Rojas',
  email: 'ana@ucb.edu.bo',
  photoUrl: null,
  role: 'COMMUNITY' as const,
  hasSeenGuide: false,
};

function setup() {
  const saved = new Map([
    [profile.id, { ...profile }],
    ['usuario-2', { ...profile, id: 'usuario-2' }],
  ]);
  const markGuideSeen = jest.fn(async (id: string) => {
    const current = saved.get(id)!;
    saved.set(id, { ...current, hasSeenGuide: true });
  });
  const users: UsersRepository = {
    findById: async (id) => saved.get(id) ?? null,
    create: async (newProfile) => ({ ...newProfile, hasSeenGuide: false }),
    listWelfareEmails: async () => [],
    markGuideSeen,
  };
  const verifyToken = async (token: string) => (token === 'valid-token' ? profile : null);
  const app = createApp({ users, verifyToken, allowSampleUsers: false });
  return { app, users, saved, markGuideSeen, verifyToken };
}

describe('Guardar la guía vista del usuario autenticado', () => {
  it('consultar el perfil no marca la guía como vista', async () => {
    const { app, markGuideSeen } = setup();

    const response = await request(app).get('/me').auth('valid-token', { type: 'bearer' });

    expect(response.body.hasSeenGuide).toBe(false);
    expect(markGuideSeen).not.toHaveBeenCalled();
  });

  it('actualiza solo al usuario de la sesión e ignora IDs y estados enviados por el cliente', async () => {
    const { app, saved, markGuideSeen } = setup();

    const response = await request(app)
      .post('/me/guide-seen')
      .auth('valid-token', { type: 'bearer' })
      .send({ id: 'usuario-2', userId: 'usuario-2', hasSeenGuide: false });

    expect(response.status).toBe(204);
    expect(markGuideSeen).toHaveBeenCalledWith('usuario-1');
    expect(saved.get('usuario-1')?.hasSeenGuide).toBe(true);
    expect(saved.get('usuario-2')?.hasSeenGuide).toBe(false);
  });

  it('es idempotente y conserva el estado en un nuevo ingreso', async () => {
    const { app, users, verifyToken } = setup();

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await request(app)
        .post('/me/guide-seen')
        .auth('valid-token', { type: 'bearer' });
      expect(response.status).toBe(204);
    }
    const nextLogin = createApp({ users, verifyToken, allowSampleUsers: false });
    const response = await request(nextLogin).get('/me').auth('valid-token', { type: 'bearer' });

    expect(response.body.hasSeenGuide).toBe(true);
  });

  it.each([undefined, 'expired-token'])('rechaza una sesión ausente o inválida (%s)', async (token) => {
    const { app, markGuideSeen } = setup();
    const pending = request(app).post('/me/guide-seen');

    const response = await (token ? pending.auth(token, { type: 'bearer' }) : pending);

    expect(response.status).toBe(401);
    expect(markGuideSeen).not.toHaveBeenCalled();
  });

  it('rechaza cuentas ajenas a la universidad sin modificar el perfil', async () => {
    const { users, markGuideSeen } = setup();
    const app = createApp({
      users,
      verifyToken: async () => ({ ...profile, email: 'ana@gmail.com' }),
      allowSampleUsers: false,
    });

    const response = await request(app)
      .post('/me/guide-seen')
      .auth('valid-token', { type: 'bearer' });

    expect(response.status).toBe(403);
    expect(markGuideSeen).not.toHaveBeenCalled();
  });

  it('informa del error y conserva el estado pendiente cuando falla el guardado', async () => {
    const { app, saved, markGuideSeen } = setup();
    markGuideSeen.mockRejectedValueOnce(new Error('Base no disponible'));

    const response = await request(app)
      .post('/me/guide-seen')
      .auth('valid-token', { type: 'bearer' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'No se pudo guardar la guía. Inténtalo de nuevo.' });
    expect(saved.get('usuario-1')?.hasSeenGuide).toBe(false);
  });
});
