import type { AppUser } from '@shared/user';

/**
 * The signed-in user with the role saved now in the database, so a role the Administrator
 * gave or took away shows up without signing in again. Everything else stays as it is.
 */
export function withRefreshedRole(currentUser: AppUser, refreshedUser: AppUser | null): AppUser {
  if (!refreshedUser || refreshedUser.role === currentUser.role) {
    return currentUser;
  }
  return { ...currentUser, role: refreshedUser.role };
}
