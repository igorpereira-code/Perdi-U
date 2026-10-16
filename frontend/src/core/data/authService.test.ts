import type { SupabaseClient } from '@supabase/supabase-js';
import { createAuthService } from './authService';

const igor = {
  id: 'google-1',
  name: 'Igor Pereira',
  email: 'igor.pereira@ucb.edu.bo',
  role: 'COMMUNITY',
};

function fakeAuth(session: { access_token: string } | null) {
  const auth = { getSession: jest.fn().mockResolvedValue({ data: { session } }) };
  return auth as unknown as SupabaseClient['auth'];
}

describe('Saber quién inició sesión', () => {
  it('no pide nada a la API cuando nadie inició sesión', async () => {
    const fetchFn = jest.fn();
    const service = createAuthService({ auth: fakeAuth(null), apiUrl: 'http://api', fetchFn });

    await expect(service.getCurrentUser()).resolves.toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });
  it('trae de la API al usuario que inició sesión', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ ok: true, json: async () => igor });
    const service = createAuthService({
      auth: fakeAuth({ access_token: 'token-123' }),
      apiUrl: 'http://api',
      fetchFn,
    });

    await expect(service.getCurrentUser()).resolves.toEqual(igor);
    expect(fetchFn).toHaveBeenCalledWith('http://api/me', {
      headers: { Authorization: 'Bearer token-123' },
    });
  });
});
