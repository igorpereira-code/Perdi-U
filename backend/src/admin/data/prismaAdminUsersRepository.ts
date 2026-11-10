import { db } from '../../core/data/prisma';
import type { AdminUsersRepository } from './adminUsersRepository';

export const prismaAdminUsersRepository: AdminUsersRepository = {
  listUsers: () =>
    db().user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    }),
};
