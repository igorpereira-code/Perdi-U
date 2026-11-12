import { db } from './prisma';
import { prismaUsersRepository } from './prismaUsersRepository';

jest.mock('./prisma', () => ({ db: jest.fn() }));

const user = {
  findUnique: jest.fn(),
  update: jest.fn(),
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(db).mockReturnValue({ user } as unknown as ReturnType<typeof db>);
});

describe('Estado persistente de la guía en el perfil', () => {
  it('consulta el estado de la guía junto con el perfil', async () => {
    await prismaUsersRepository.findById('usuario-1');

    expect(user.findUnique).toHaveBeenCalledWith({
      where: { id: 'usuario-1' },
      select: expect.objectContaining({ hasSeenGuide: true }),
    });
  });

  it('marca únicamente la guía del perfil indicado como vista', async () => {
    await prismaUsersRepository.markGuideSeen('usuario-1');

    expect(user.update).toHaveBeenCalledWith({
      where: { id: 'usuario-1' },
      data: { hasSeenGuide: true },
      select: { id: true },
    });
  });

  it('propaga un fallo de persistencia', async () => {
    user.update.mockRejectedValueOnce(new Error('Base no disponible'));

    await expect(prismaUsersRepository.markGuideSeen('usuario-1')).rejects.toThrow(
      'Base no disponible',
    );
  });
});
