import { PrismaClient } from '@prisma/client';
import type { UsersRepository } from './usersRepository';

let prisma: PrismaClient | undefined;

function db(): PrismaClient {
  prisma ??= new PrismaClient();
  return prisma;
}

const PROFILE_FIELDS = { id: true, name: true, email: true, photoUrl: true, role: true } as const;

export const prismaUsersRepository: UsersRepository = {
  findById: (id) => db().user.findUnique({ where: { id }, select: PROFILE_FIELDS }),

  // upsert instead of create: if two requests arrive at the same time, the second one does not fail.
  create: (profile) =>
    db().user.upsert({
      where: { id: profile.id },
      create: profile,
      update: {},
      select: PROFILE_FIELDS,
    }),

  listWelfareEmails: async () => (await db().welfareEmail.findMany()).map((row) => row.email),
};
