import type { FoundItemStatus } from '@shared/statuses';

/** Only items that Bienestar already received (in custody) can be published. */
export function canBePublished(status: FoundItemStatus): boolean {
  return status === 'IN_CUSTODY';
}
