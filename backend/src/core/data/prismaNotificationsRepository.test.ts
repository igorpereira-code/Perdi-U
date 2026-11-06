import { db } from './prisma';
import { prismaNotificationsRepository } from './prismaNotificationsRepository';

jest.mock('./prisma', () => ({ db: jest.fn() }));

const notification = {
  findMany: jest.fn(),
  create: jest.fn(),
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(db).mockReturnValue({ notification } as unknown as ReturnType<typeof db>);
  notification.findMany.mockResolvedValue([]);
});

describe('Avisos guardados en la base de datos', () => {
  it('busca solo los avisos del usuario indicado', async () => {
    await prismaNotificationsRepository.listForUser('usuario-ana');

    expect(notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'usuario-ana' } }),
    );
  });

  it('guarda un aviso nuevo para su destinatario', async () => {
    await prismaNotificationsRepository.notify({
      userId: 'usuario-ana',
      message: 'Bienestar recibió tu objeto HZ-0001.',
      link: '/mis-reportes/encontrados/HZ-0001',
    });

    expect(notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'usuario-ana',
        message: 'Bienestar recibió tu objeto HZ-0001.',
        link: '/mis-reportes/encontrados/HZ-0001',
      },
    });
  });

  it('guarda un aviso sin pantalla relacionada', async () => {
    await prismaNotificationsRepository.notify({ userId: 'usuario-ana', message: 'Aviso general' });

    expect(notification.create).toHaveBeenCalledWith({
      data: { userId: 'usuario-ana', message: 'Aviso general', link: null },
    });
  });
});
