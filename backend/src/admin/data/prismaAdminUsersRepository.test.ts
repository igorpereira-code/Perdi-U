import { db } from '../../core/data/prisma';
import { prismaAdminUsersRepository } from './prismaAdminUsersRepository';

jest.mock('../../core/data/prisma', () => ({ db: jest.fn() }));

const user = { findMany: jest.fn() };

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(db).mockReturnValue({ user } as unknown as ReturnType<typeof db>);
  user.findMany.mockResolvedValue([]);
});

describe('Usuarios guardados en la base de datos', () => {
  it('pide el nombre, correo y rol de todos los usuarios, ordenados por nombre', async () => {
    await prismaAdminUsersRepository.listUsers();

    expect(user.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
  });
});
