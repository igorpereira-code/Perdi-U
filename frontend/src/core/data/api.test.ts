import type { SupabaseClient } from '@supabase/supabase-js';
import { createApiFetch } from './api';

function fakeAuth(session: { access_token: string } | null) {
  return {
    getSession: jest.fn().mockResolvedValue({ data: { session } }),
  } as unknown as SupabaseClient['auth'];
}

describe('Llamar al backend con la sesión del usuario', () => {
  it('manda la sesión del usuario en cada pedido', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ ok: true });
    const apiFetch = createApiFetch({
      auth: fakeAuth({ access_token: 'token-123' }),
      apiUrl: 'http://api',
      fetchFn,
    });

    await apiFetch('/lost-reports/PR-0001/matches', { method: 'POST' });

    expect(fetchFn).toHaveBeenCalledWith('http://api/lost-reports/PR-0001/matches', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-123' },
    });
  });
});
