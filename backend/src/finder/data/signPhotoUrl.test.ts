import { LIST_PHOTO_URL_TTL_SECONDS, signPhotoUrl } from './signPhotoUrl';

function storage() {
  return { createSignedUrl: jest.fn().mockResolvedValue('https://storage.test/firmada') };
}

describe('signPhotoUrl', () => {
  it('cambia una foto guardada por un enlace temporal', async () => {
    const photos = storage();

    await expect(signPhotoUrl(photos, 'user-1/foto-1.jpg')).resolves.toBe('https://storage.test/firmada');
    expect(photos.createSignedUrl).toHaveBeenCalledWith('user-1/foto-1.jpg', LIST_PHOTO_URL_TTL_SECONDS);
  });

  it('deja igual un objeto sin foto', async () => {
    const photos = storage();

    await expect(signPhotoUrl(photos, null)).resolves.toBeNull();
    expect(photos.createSignedUrl).not.toHaveBeenCalled();
  });

  it('deja igual un enlace que ya se puede abrir', async () => {
    const photos = storage();

    await expect(signPhotoUrl(photos, 'https://ejemplo.test/foto.jpg')).resolves.toBe('https://ejemplo.test/foto.jpg');
    expect(photos.createSignedUrl).not.toHaveBeenCalled();
  });

  it('muestra el objeto sin foto si no se pudo crear el enlace', async () => {
    const photos = { createSignedUrl: jest.fn().mockRejectedValue(new Error('Storage caído')) };

    await expect(signPhotoUrl(photos, 'user-1/foto-1.jpg')).resolves.toBeNull();
  });
});
