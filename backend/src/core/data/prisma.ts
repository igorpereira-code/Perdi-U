import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | undefined;

/** The database client, shared by the whole backend. It is created the first time it is used. */
export function db(): PrismaClient {
  prisma ??= new PrismaClient();
  return prisma;
}
