import type { Role } from '@shared/user';

/** Where each user lands after signing in according to their workspace. */
export function getStartPath(role: Role): string {
  if (role === 'ADMIN') {
    return '/administracion';
  }
  if (role === 'WELFARE') {
    return '/bienestar';
  }
  return '/';
}
