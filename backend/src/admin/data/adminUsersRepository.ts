import type { ManagedUser } from '@shared/admin';
import type { Role } from '@shared/user';

/** Where the Administrator reads and changes users. The real one uses the database; tests use a fake one. */
export type AdminUsersRepository = {
  /** All users, ordered by name. */
  listUsers: () => Promise<ManagedUser[]>;
  /** The user with that id, or null if it does not exist. */
  findUser: (userId: string) => Promise<ManagedUser | null>;
  /** Saves the new role and returns the updated user. */
  changeRole: (userId: string, newRole: Role) => Promise<ManagedUser>;
};
