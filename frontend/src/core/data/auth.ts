import type { SupabaseClient } from '@supabase/supabase-js';
import { INSTITUTIONAL_EMAIL_DOMAIN } from '@shared/constants';

export async function signInWithGoogle(auth: SupabaseClient['auth']): Promise<void> {
  await auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: { hd: INSTITUTIONAL_EMAIL_DOMAIN, prompt: 'select_account' },
    },
  });
}
