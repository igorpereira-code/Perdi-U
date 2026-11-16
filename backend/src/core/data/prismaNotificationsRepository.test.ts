import { db } from './prisma';
import { prismaNotificationsRepository } from './prismaNotificationsRepository';

jest.mock('./prisma', () => ({ db: jest.fn() }));

const notification = {
  findMany: jest.fn(),
  create: jest.fn(),
  findFirst: jest.fn(),
  updateMany: jest.fn(),
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

  it('pide los avisos del más reciente al más antiguo', async () => {
    await prismaNotificationsRepository.listForUser('usuario-ana');

    expect(notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
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

describe('Marcar en la base de datos un aviso como abierto', () => {
  it('guarda cuándo lo abrió, solo si es del usuario y todavía no lo había abierto', async () => {
    notification.findFirst.mockResolvedValue({ id: 'aviso-1' });

    await expect(prismaNotificationsRepository.markRead('aviso-1', 'usuario-ana')).resolves.toBe(
      true,
    );

    expect(notification.findFirst).toHaveBeenCalledWith({
      where: { id: 'aviso-1', userId: 'usuario-ana' },
      select: { id: true },
    });
    expect(notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'aviso-1', userId: 'usuario-ana', readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });

  it('no cambia nada si el aviso no es del usuario', async () => {
    notification.findFirst.mockResolvedValue(null);

    await expect(prismaNotificationsRepository.markRead('aviso-2', 'usuario-ana')).resolves.toBe(
      false,
    );

    expect(notification.updateMany).not.toHaveBeenCalled();
  });
});
