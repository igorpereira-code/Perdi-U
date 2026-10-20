import type { Request } from 'express';
import { FoundItemRequestError, MAX_PHOTO_BYTES, validateFoundItemPhoto, type ValidatedPhoto } from '../logic/validateFoundItemPhoto';

/** Multipart se analiza con las APIs nativas de Node; no se confía en rutas ni nombres del cliente. */
export async function readFoundItemRequest(req: Request): Promise<{ report: unknown; photo: ValidatedPhoto | null }> {
  if (!req.is('multipart/form-data')) {
    return { report: req.body, photo: null };
  }
  try {
    if (!Buffer.isBuffer(req.body)) { throw new Error('Cuerpo no disponible'); }
    const request = new globalThis.Request('http://localhost/found-items', {
      method: 'POST',
      headers: { 'Content-Type': req.header('content-type') ?? '' },
      body: new Uint8Array(req.body),
    });
    const form = await request.formData();
    const reports = form.getAll('report');
    const photos = form.getAll('photo');
    if (reports.length !== 1 || typeof reports[0] !== 'string' || reports[0].length > 65536
      || photos.length > 1 || [...form.keys()].some((key) => key !== 'report' && key !== 'photo')) {
      throw new Error('Campos no válidos');
    }
    const report: unknown = JSON.parse(reports[0]);
    const photo = photos[0];
    if (photo === undefined) { return { report, photo: null }; }
    if (typeof photo === 'string') { throw new Error('Fotografía no válida'); }
    if (photo.size > MAX_PHOTO_BYTES) {
      throw new FoundItemRequestError(413, 'La fotografía debe pesar como máximo 5 MiB.');
    }
    return { report, photo: validateFoundItemPhoto(Buffer.from(await photo.arrayBuffer()), photo.type) };
  } catch (error) {
    if (error instanceof FoundItemRequestError) { throw error; }
    throw new FoundItemRequestError(400, 'No se pudo leer el formulario y su fotografía.');
  }
}
