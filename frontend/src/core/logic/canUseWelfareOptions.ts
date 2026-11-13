import type { Role } from '@shared/user';

/** Only Bienestar staff see the Bienestar options. */
export function canUseWelfareOptions(role: Role): boolean {
  return role === 'WELFARE';
}
