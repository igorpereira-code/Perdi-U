import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppUser } from '@shared/user';
import { signInWithGoogle } from './auth';

/** The user signed in with a Google account that is not from the university. */
export class NotInstitutionalEmailError extends Error {}

export type AuthService = {
  getCurrentUser: () => Promise<AppUser | null>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

type AuthServiceDependencies = {
  auth: SupabaseClient['auth'];
  apiUrl: string;
  sendRequest?: typeof fetch;
};

export function createAuthService({
  auth,
  apiUrl,
  sendRequest = (url, init) => fetch(url, init),
}: AuthServiceDependencies): AuthService {
  return {
    getCurrentUser: async () => {
      const { data } = await auth.getSession();
      if (!data.session) {
        return null;
      }

      const response = await sendRequest(`${apiUrl}/me`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (response.status === 401) {
        await auth.signOut();
        return null;
      }
      if (response.status === 403) {
        await auth.signOut();
        throw new NotInstitutionalEmailError();
      }
      return response.json();
    },
    signIn: () => signInWithGoogle(auth),
    signOut: async () => {
      await auth.signOut();
    },
  };
}
