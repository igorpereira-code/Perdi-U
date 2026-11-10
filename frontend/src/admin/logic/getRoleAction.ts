import type { Role } from '@shared/user';

/** What the Administrator can do with a user's role, as a button. */
export type RoleAction = {
  newRole: Role;
  label: string;
  loadingText: string;
};

/** The role change the Administrator can make to a user, or null if none. */
export function getRoleAction(currentRole: Role): RoleAction | null {
  if (currentRole === 'COMMUNITY') {
    return { newRole: 'WELFARE', label: 'Asignar Bienestar', loadingText: 'Asignando…' };
  }
  return null;
}
