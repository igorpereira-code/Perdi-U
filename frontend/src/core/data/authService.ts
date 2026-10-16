import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppUser } from '@shared/user';
import { signInWithGoogle } from './auth';

export type AuthService = {
  getCurrentUser: () => Promise<AppUser | null>;
  signIn: () => Promise<void>;
};

type AuthServiceDeps = {
  auth: SupabaseClient['auth'];
  apiUrl: string;
  fetchFn?: typeof fetch;
};

export function createAuthService({
  auth,
  apiUrl,
  fetchFn = (url, init) => fetch(url, init),
}: AuthServiceDeps): AuthService {
  return {
    getCurrentUser: async () => {
      const { data } = await auth.getSession();
      if (!data.session) {
        return null;
      }

      const response = await fetchFn(`${apiUrl}/me`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      return response.json();
    },
    signIn: () => signInWithGoogle(auth),
  };
}
