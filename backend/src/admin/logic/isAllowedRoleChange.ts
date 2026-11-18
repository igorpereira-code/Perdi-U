import type { Role } from '@shared/user';

/** The Administrator can only give or take away the Bienestar role. The Administrator role never changes. */
export function isAllowedRoleChange(currentRole: Role, newRole: Role): boolean {
  const isGivingWelfare = currentRole === 'COMMUNITY' && newRole === 'WELFARE';
  const isTakingAwayWelfare = currentRole === 'WELFARE' && newRole === 'COMMUNITY';
  return isGivingWelfare || isTakingAwayWelfare;
}
