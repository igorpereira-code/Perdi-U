import request from 'supertest';
import { createApp } from './app';

describe('Estado de la API (GET /health)', () => {
  it('responde que la API está funcionando', async () => {
    const res = await request(createApp()).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', app: 'Perdi-U' });
  });
});
