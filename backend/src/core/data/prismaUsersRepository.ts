import { db } from './prisma';
import type { UsersRepository } from './usersRepository';

const PROFILE_FIELDS = {
  id: true,
  name: true,
  email: true,
  photoUrl: true,
  role: true,
  hasSeenGuide: true,
} as const;

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

  markGuideSeen: async (id) => {
    await db().user.update({
      where: { id },
      data: { hasSeenGuide: true },
      select: { id: true },
    });
  },

  listWelfareEmails: async () => (await db().welfareEmail.findMany()).map((row) => row.email),
};
