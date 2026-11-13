import type { Role } from '@shared/user';

/** Where each user lands after signing in: the Administrator goes straight to Administración. */
export function getStartPath(role: Role): string {
  return role === 'ADMIN' ? '/administracion' : '/';
}
