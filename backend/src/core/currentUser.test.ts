import express from 'express';
import request from 'supertest';
import { createApp } from '../app';
import { currentUser, requireRole } from './currentUser';

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
