import type { NotificationsRepository, StoredNotification } from './notificationsRepository';

/** In-memory notifications repository for tests. It never touches the shared database. */
export function fakeNotificationsRepository(initial: StoredNotification[] = []) {
  // A copy, so one test does not change the notifications of the next one.
  const saved = initial.map((notification) => ({ ...notification }));

  const repository: NotificationsRepository & { saved: StoredNotification[] } = {
    saved,
    listForUser: async (userId) => saved.filter((notification) => notification.userId === userId),
    notify: async ({ userId, message, link = null }) => {
      saved.push({
        id: `aviso-${saved.length + 1}`,
        userId,
        message,
        link,
        createdAt: new Date(),
        readAt: null,
      });
    },
  };
  return repository;
}
