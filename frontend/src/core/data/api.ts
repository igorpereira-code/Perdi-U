import type { SupabaseClient } from '@supabase/supabase-js';

export type ApiFetch = (path: string, init?: RequestInit) => Promise<Response>;

type ApiFetchDeps = {
  auth: SupabaseClient['auth'];
  apiUrl: string;
  fetchFn?: typeof fetch;
};

/** Calls our backend and sends the user's session, so the backend knows who is asking. */
export function createApiFetch({
  auth,
  apiUrl,
  fetchFn = (url, init) => fetch(url, init),
}: ApiFetchDeps): ApiFetch {
  return async (path, init = {}) => {
    const { data } = await auth.getSession();
    const headers = data.session
      ? { ...init.headers, Authorization: `Bearer ${data.session.access_token}` }
      : init.headers;
    return fetchFn(`${apiUrl}${path}`, { ...init, headers });
  };
}
