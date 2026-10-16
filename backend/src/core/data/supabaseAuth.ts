import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { TokenUser } from '../currentUser';

let client: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  client ??= createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_ANON_KEY ?? '');
  return client;
}

/** Asks Supabase who owns the login token. Returns null if the token is not valid. */
export async function verifySupabaseToken(token: string): Promise<TokenUser | null> {
  const { data, error } = await getClient().auth.getUser(token);
  if (error || !data.user?.email) {
    return null;
  }

  const profile = data.user.user_metadata;
  return {
    id: data.user.id,
    name: profile.full_name ?? profile.name ?? data.user.email,
    email: data.user.email,
    photoUrl: profile.avatar_url ?? profile.picture ?? null,
  };
}
