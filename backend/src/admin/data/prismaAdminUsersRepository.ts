import { db } from '../../core/data/prisma';
import type { AdminUsersRepository } from './adminUsersRepository';

const MANAGED_USER_FIELDS = { id: true, name: true, email: true, role: true } as const;

export const prismaAdminUsersRepository: AdminUsersRepository = {
  listUsers: () =>
    db().user.findMany({
      select: MANAGED_USER_FIELDS,
      orderBy: { name: 'asc' },
    }),
  findUser: (userId) =>
    db().user.findUnique({ where: { id: userId }, select: MANAGED_USER_FIELDS }),
  changeRole: (userId, newRole) =>
    db().user.update({
      where: { id: userId },
      data: { role: newRole },
      select: MANAGED_USER_FIELDS,
    }),
};
