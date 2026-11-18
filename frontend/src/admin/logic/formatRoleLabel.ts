import type { Role } from '@shared/user';

const ROLE_LABELS: Record<Role, string> = {
  COMMUNITY: 'Comunidad',
  WELFARE: 'Bienestar',
  ADMIN: 'Administrador',
};

/** The name of a role as the user reads it. */
export function formatRoleLabel(role: Role): string {
  return ROLE_LABELS[role];
}
