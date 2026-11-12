export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export type ValidatedPhoto = { bytes: Buffer; contentType: string; extension: string };

export class FoundItemRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export function validateFoundItemPhoto(bytes: Buffer, contentType: string): ValidatedPhoto {
  if (bytes.length === 0) {
    throw new FoundItemRequestError(400, 'La fotografía está vacía.');
  }
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new FoundItemRequestError(413, 'La fotografía debe pesar como máximo 5 MiB.');
  }
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const isWebp = bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF'
    && bytes.toString('ascii', 8, 12) === 'WEBP';
  const extension = contentType === 'image/png' && isPng ? 'png'
    : contentType === 'image/jpeg' && isJpeg ? 'jpg'
      : contentType === 'image/webp' && isWebp ? 'webp' : null;
  if (!extension) {
    throw new FoundItemRequestError(415, 'Selecciona una fotografía JPEG, PNG o WebP válida.');
  }
  return { bytes, contentType, extension };
}
