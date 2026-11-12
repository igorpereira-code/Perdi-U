import type { Role } from '@shared/user';

/** Only the Administrator can manage users and their roles. */
export function canManageUsers(role: Role): boolean {
  return role === 'ADMIN';
}
