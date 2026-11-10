import type { AppNotification } from '@shared/notifications';

/** The list after the user opens one notification. The first time it was opened is kept. */
export function markNotificationRead(
  notifications: AppNotification[],
  id: string,
  now: Date = new Date(),
): AppNotification[] {
  return notifications.map((notification) =>
    notification.id === id && notification.readAt === null
      ? { ...notification, readAt: now.toISOString() }
      : notification,
  );
}
