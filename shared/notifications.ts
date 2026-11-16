/** An in-app notification, as the API returns it in GET /me/notifications. */
export type AppNotification = {
  id: string;
  /** What happened, written for the user. */
  message: string;
  /** Screen to open when the user taps it (e.g. /mis-perdidas/PR-0001), or null. */
  link: string | null;
  createdAt: string;
  /** null while the user has not opened it. */
  readAt: string | null;
};
