import type { ManagedUser } from '@shared/admin';

/** Where the Administrator reads users. The real one uses the database; tests use a fake one. */
export type AdminUsersRepository = {
  /** All users, ordered by name. */
  listUsers: () => Promise<ManagedUser[]>;
};
