import type { Role } from '@shared/user';

export function roleForEmail(email: string, welfareEmails: string[]): Role {
  const normalized = email.toLowerCase();
  return welfareEmails.some((welfareEmail) => welfareEmail.toLowerCase() === normalized)
    ? 'WELFARE'
    : 'COMMUNITY';
}
