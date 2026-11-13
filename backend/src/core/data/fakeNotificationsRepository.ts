import type { NotificationsRepository, StoredNotification } from './notificationsRepository';

/** In-memory notifications repository for tests. It never touches the shared database. */
export function fakeNotificationsRepository(initial: StoredNotification[] = []) {
  // A copy, so one test does not change the notifications of the next one.
  const savedNotifications = initial.map((notification) => ({ ...notification }));

  const repository: NotificationsRepository & { saved: StoredNotification[] } = {
    saved: savedNotifications,
    listForUser: async (userId) =>
      savedNotifications.filter((notification) => notification.userId === userId),
    notify: async ({ userId, message, link = null }) => {
      savedNotifications.push({
        id: `aviso-${savedNotifications.length + 1}`,
        userId,
        message,
        link,
        createdAt: new Date(),
        readAt: null,
      });
    },
    markRead: async (id, userId) => {
      const notification = savedNotifications.find(
        (stored) => stored.id === id && stored.userId === userId,
      );
      if (!notification) {
        return false;
      }
      notification.readAt ??= new Date();
      return true;
    },
  };
  return repository;
}
