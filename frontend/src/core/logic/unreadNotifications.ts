import type { AppNotification } from '@shared/notifications';

const MAX_SHOWN = 9;

/** How many notifications the user has not opened yet. */
export function countUnread(notifications: AppNotification[]): number {
  return notifications.filter((notification) => notification.readAt === null).length;
}

/** Number shown next to the notifications option, or null when there is nothing new. */
export function formatUnreadBadge(count: number): string | null {
  if (count <= 0) {
    return null;
  }
  return count > MAX_SHOWN ? `${MAX_SHOWN}+` : String(count);
}
