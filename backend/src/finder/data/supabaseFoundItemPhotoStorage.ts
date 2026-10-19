import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FoundItemPhotoStorage } from './foundItemPhotoStorage';

type PhotoBucket = Pick<ReturnType<SupabaseClient['storage']['from']>, 'upload' | 'remove' | 'createSignedUrl'>;

export const FOUND_ITEM_PHOTO_BUCKET = 'found-item-photos';
const STORAGE_ERROR = 'No se pudo completar la operación de fotografías.';

async function storageOperation<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch {
    // Los errores del SDK y la configuración permanecen exclusivamente en el servidor.
    throw new Error(STORAGE_ERROR);
  }
}

export function createFoundItemPhotoStorage(getBucket: () => PhotoBucket): FoundItemPhotoStorage {
  return {
    upload: (path, bytes, contentType) => storageOperation(async () => {
      const { error } = await getBucket().upload(path, bytes, { contentType, upsert: false, cacheControl: '0' });
      if (error) { throw new Error(STORAGE_ERROR); }
    }),
    remove: (path) => storageOperation(async () => {
      const { error } = await getBucket().remove([path]);
      if (error) { throw new Error(STORAGE_ERROR); }
    }),
    createSignedUrl: (path, expiresIn) => storageOperation(async () => {
      const { data, error } = await getBucket().createSignedUrl(path, expiresIn);
      if (error || !data?.signedUrl) { throw new Error(STORAGE_ERROR); }
      return data.signedUrl;
    }),
  };
}

let serverClient: SupabaseClient | undefined;
export const supabaseFoundItemPhotoStorage = createFoundItemPhotoStorage(() => {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) { throw new Error(STORAGE_ERROR); }
  serverClient ??= createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return serverClient.storage.from(FOUND_ITEM_PHOTO_BUCKET);
});
