import type { SupabaseClient } from '@supabase/supabase-js';
import { signInWithGoogle } from './auth';

describe('Ingresar con Google', () => {
  it('abre el selector de cuentas de Google mostrando las cuentas de la universidad', async () => {
    const auth = { signInWithOAuth: jest.fn() };

    await signInWithGoogle(auth as unknown as SupabaseClient['auth']);

    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        queryParams: { hd: 'ucb.edu.bo', prompt: 'select_account' },
      }),
    });
  });
});
