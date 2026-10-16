import { INSTITUTIONAL_EMAIL_DOMAIN } from '@shared/constants';

export function isInstitutionalEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${INSTITUTIONAL_EMAIL_DOMAIN}`);
}
