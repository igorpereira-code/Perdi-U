import { createFoundItemPhotoStorage } from './supabaseFoundItemPhotoStorage';

type PhotoBucket = ReturnType<Parameters<typeof createFoundItemPhotoStorage>[0]>;

function fakeStorage() {
  const bucket = {
    upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
    remove: jest.fn().mockResolvedValue({ data: [], error: null }),
    createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://storage.example/foto-firmada' }, error: null }),
  };
  const storage = createFoundItemPhotoStorage(() => bucket as unknown as PhotoBucket);
  return { bucket, storage };
}

describe('Adaptador de fotografías de Supabase', () => {
  it('sube los bytes a la ruta recibida sin sobrescribir archivos ni devolver URLs públicas', async () => {
    const { bucket, storage } = fakeStorage();
    const bytes = Buffer.from([137, 80, 78, 71]);

    await expect(storage.upload('usuario/archivo.png', bytes, 'image/png')).resolves.toBeUndefined();

    expect(bucket.upload).toHaveBeenCalledWith('usuario/archivo.png', bytes, {
      contentType: 'image/png', upsert: false, cacheControl: '0',
    });
  });

  it('elimina únicamente la ruta del archivo que debe compensar', async () => {
    const { bucket, storage } = fakeStorage();

    await storage.remove('usuario/archivo.png');

    expect(bucket.remove).toHaveBeenCalledWith(['usuario/archivo.png']);
  });

  it('genera una URL firmada con vencimiento explícito', async () => {
    const { bucket, storage } = fakeStorage();

    await expect(storage.createSignedUrl('usuario/archivo.png', 60))
      .resolves.toBe('https://storage.example/foto-firmada');
    expect(bucket.createSignedUrl).toHaveBeenCalledWith('usuario/archivo.png', 60);
  });

  it.each(['upload', 'remove', 'createSignedUrl'] as const)('controla errores de %s sin incluir detalles del proveedor', async (operation) => {
    const { bucket, storage } = fakeStorage();
    bucket[operation].mockResolvedValue({ data: null, error: { message: 'Detalle interno del proveedor' } } as never);
    const action = operation === 'upload'
      ? storage.upload('usuario/archivo.png', Buffer.from([1]), 'image/png')
      : operation === 'remove'
        ? storage.remove('usuario/archivo.png')
        : storage.createSignedUrl('usuario/archivo.png', 60);

    await expect(action).rejects.toThrow('No se pudo completar la operación de fotografías.');
  });
});
