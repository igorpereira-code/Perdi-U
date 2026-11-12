import type { FoundItemStatus } from '@shared/statuses';

export function wasReceivedByWelfare(status: FoundItemStatus): boolean {
  return status !== 'PENDING_DROP_OFF';
}
