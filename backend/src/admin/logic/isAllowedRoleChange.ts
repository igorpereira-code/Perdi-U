import type { Role } from '@shared/user';

/** The Administrator can only give the Bienestar role to a member of the community. */
export function isAllowedRoleChange(currentRole: Role, newRole: Role): boolean {
  return currentRole === 'COMMUNITY' && newRole === 'WELFARE';
}
