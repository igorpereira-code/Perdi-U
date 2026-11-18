import type { FoundItemPhotoStorage } from './foundItemPhotoStorage';

const STORED_PHOTO_PATH = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(png|jpg|webp)$/;
export const LIST_PHOTO_URL_TTL_SECONDS = 600;

/** Turns a photo saved in the private bucket into a temporary link the browser can show. */
export async function signPhotoUrl(
  photos: Pick<FoundItemPhotoStorage, 'createSignedUrl'>,
  photoUrl: string | null,
): Promise<string | null> {
  if (!photoUrl || !STORED_PHOTO_PATH.test(photoUrl)) {
    return photoUrl;
  }
  try {
    return await photos.createSignedUrl(photoUrl, LIST_PHOTO_URL_TTL_SECONDS);
  } catch {
    return null;
  }
}
