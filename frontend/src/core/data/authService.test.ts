import type { SupabaseClient } from '@supabase/supabase-js';
import { createAuthService, NotInstitutionalEmailError } from './authService';

const igor = {
  id: 'google-1',
  name: 'Igor Pereira',
  email: 'igor.pereira@ucb.edu.bo',
  role: 'COMMUNITY',
  hasSeenGuide: true,
};

function fakeAuth(session: { access_token: string } | null) {
  const auth = {
    getSession: jest.fn().mockResolvedValue({ data: { session } }),
    signOut: jest.fn(),
  };
  return auth as unknown as SupabaseClient['auth'];
}

describe('Saber quién inició sesión', () => {
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

  it('no pide nada a la API cuando nadie inició sesión', async () => {
    const fetchFn = jest.fn();
    const service = createAuthService({ auth: fakeAuth(null), apiUrl: 'http://api', fetchFn });

    await expect(service.getCurrentUser()).resolves.toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('cierra la sesión y avisa cuando la cuenta no es de la universidad', async () => {
    const auth = fakeAuth({ access_token: 'gmail-token' });
    const fetchFn = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ code: 'NOT_INSTITUTIONAL_EMAIL' }),
    });
    const service = createAuthService({ auth, apiUrl: 'http://api', fetchFn });

    await expect(service.getCurrentUser()).rejects.toThrow(NotInstitutionalEmailError);
    expect(auth.signOut).toHaveBeenCalled();
  });

  it('cierra la sesión cuando el usuario lo pide', async () => {
    const auth = fakeAuth({ access_token: 'token-123' });
    const service = createAuthService({ auth, apiUrl: 'http://api', fetchFn: jest.fn() });

    await service.signOut();

    expect(auth.signOut).toHaveBeenCalled();
  });

  it('cierra la sesión cuando ya no es válida, para que vuelva a ingresar', async () => {
    const auth = fakeAuth({ access_token: 'expired-token' });
    const fetchFn = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: 'expired' }) });
    const service = createAuthService({ auth, apiUrl: 'http://api', fetchFn });

    await expect(service.getCurrentUser()).resolves.toBeNull();
    expect(auth.signOut).toHaveBeenCalled();
  });
});
