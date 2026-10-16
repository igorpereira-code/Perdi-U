import express from 'express';
import request from 'supertest';
import { createApp } from '../app';
import { currentUser, requireRole } from './currentUser';
import type { UserProfile, UsersRepository } from './data/usersRepository';

function fakeUsers(welfareEmails: string[] = []) {
  const saved: UserProfile[] = [];
  const users: UsersRepository = {
    findById: async (id) => saved.find((user) => user.id === id) ?? null,
    create: async (profile) => {
      saved.push(profile);
      return profile;
    },
    listWelfareEmails: async () => welfareEmails,
  };
  return { users, saved };
}

describe('Ver el usuario actual (GET /me)', () => {
  it('devuelve a Ana como usuario de prueba por defecto', async () => {
    const res = await request(createApp()).get('/me');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'Ana Rojas', role: 'COMMUNITY' });
  });

  it('permite usar la app como otro usuario de prueba', async () => {
    const res = await request(createApp()).get('/me').set('x-sample-user', 'welfare');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'Bienestar Estudiantil', role: 'WELFARE' });
  });

  it('rechaza un usuario de prueba que no existe', async () => {
    const res = await request(createApp()).get('/me').set('x-sample-user', 'nobody');

    expect(res.status).toBe(400);
  });
});

describe('Restringir por rol (requireRole)', () => {
  const app = express();
  app.use(currentUser);
  app.get('/welfare-only', requireRole('WELFARE'), (_req, res) => {
    res.json({ ok: true });
  });

  it('bloquea a quien no tiene el rol', async () => {
    const res = await request(app).get('/welfare-only');

    expect(res.status).toBe(403);
  });

  it('deja pasar a quien tiene el rol', async () => {
    const res = await request(app).get('/welfare-only').set('x-sample-user', 'welfare');

    expect(res.status).toBe(200);
  });
});

describe('Ingresar con una sesión de Google', () => {
  const googleUser = {
    id: 'google-1',
    name: 'Igor Pereira',
    email: 'igor.pereira@ucb.edu.bo',
    photoUrl: 'https://foto.com/igor.jpg',
  };
  const verifyToken = async (token: string) => (token === 'valid-token' ? googleUser : null);

  it('reconoce al usuario que inició sesión con Google', async () => {
    const { users } = fakeUsers();
    const res = await request(createApp({ verifyToken, users }))
      .get('/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'Igor Pereira',
      email: 'igor.pereira@ucb.edu.bo',
      role: 'COMMUNITY',
    });
  });
  describe('Siguientes ingresos', () => {
    const googleUser = { id: 'google-1', name: 'Igor Pereira', email: 'igor.pereira@ucb.edu.bo' };
    const verifyToken = async () => googleUser;

    it('sigue usando el mismo perfil y no crea otro', async () => {
      const { users, saved } = fakeUsers();
      saved.push({ ...googleUser, photoUrl: null, role: 'WELFARE' });

      const res = await request(createApp({ verifyToken, users }))
        .get('/me')
        .set('Authorization', 'Bearer valid-token');

      expect(res.body).toMatchObject({ id: 'google-1', role: 'WELFARE' });
      expect(saved).toHaveLength(1);
    });
  });

  it('crea su perfil en su primer ingreso, sin pedirle ningún dato', async () => {
    const { users, saved } = fakeUsers();

    await request(createApp({ verifyToken, users }))
      .get('/me')
      .set('Authorization', 'Bearer valid-token');

    expect(saved).toEqual([{ ...googleUser, role: 'COMMUNITY' }]);
  });
});

describe('Perfil de Bienestar', () => {
  const welfareUser = { id: 'google-3', name: 'Bienestar UCB', email: 'bienestar@ucb.edu.bo' };
  const verifyToken = async () => welfareUser;

  it('crea el perfil con el rol de Bienestar si su correo está registrado como Bienestar', async () => {
    const { users, saved } = fakeUsers(['bienestar@ucb.edu.bo']);

    const res = await request(createApp({ verifyToken, users }))
      .get('/me')
      .set('Authorization', 'Bearer welfare-token');

    expect(res.body).toMatchObject({ role: 'WELFARE' });
    expect(saved[0]).toMatchObject({ email: 'bienestar@ucb.edu.bo', role: 'WELFARE' });
  });
});

describe('Rechazar sesiones que no son válidas', () => {
  const verifyToken = async () => null;

  it('no deja entrar con una sesión vencida o falsa', async () => {
    const res = await request(createApp({ verifyToken }))
      .get('/me')
      .set('Authorization', 'Bearer fake-token');

    expect(res.status).toBe(401);
  });
});

describe('Solo cuentas de la universidad', () => {
  const verifyToken = async () => ({ id: 'google-2', name: 'Igor', email: 'igor@gmail.com' });

  it('no deja entrar a una cuenta que no es de la universidad', async () => {
    const res = await request(createApp({ verifyToken }))
      .get('/me')
      .set('Authorization', 'Bearer gmail-token');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ code: 'NOT_INSTITUTIONAL_EMAIL' });
  });
});

describe('Sin sesión', () => {
  it('pide iniciar sesión cuando no hay sesión y los usuarios de prueba están apagados', async () => {
    const res = await request(createApp({ allowSampleUsers: false })).get('/me');

    expect(res.status).toBe(401);
  });
});
