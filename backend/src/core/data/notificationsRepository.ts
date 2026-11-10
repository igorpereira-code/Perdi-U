export type StoredNotification = {
  id: string;
  userId: string;
  message: string;
  link: string | null;
  createdAt: Date;
  readAt: Date | null;
};

export type NewNotification = {
  /** Who receives the notification. */
  userId: string;
  /** What happened, written for the user. E.g. "Bienestar recibió tu objeto HZ-0001." */
  message: string;
  /** Screen to open when the user taps it. E.g. "/mis-perdidas/PR-0001". */
  link?: string | null;
};

/**
 * Where in-app notifications are saved. The real one uses the database; tests use a fake one.
 * Each role creates its own notifications with notify() (e.g. Bienestar received an object).
 */
export type NotificationsRepository = {
  listForUser: (userId: string) => Promise<StoredNotification[]>;
  notify: (notification: NewNotification) => Promise<void>;
  /** Saves when the user opened it. Returns false if it does not exist or belongs to someone else. */
  markRead: (id: string, userId: string) => Promise<boolean>;
};
