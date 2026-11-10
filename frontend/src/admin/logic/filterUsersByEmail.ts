import type { ManagedUser } from '@shared/admin';

/** The users whose email contains what the Administrator typed. Upper or lower case does not matter. */
export function filterUsersByEmail(users: ManagedUser[], searchedEmail: string): ManagedUser[] {
  const normalizedSearch = searchedEmail.trim().toLowerCase();
  if (normalizedSearch === '') {
    return users;
  }
  return users.filter((user) => user.email.toLowerCase().includes(normalizedSearch));
}
