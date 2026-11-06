import type { AppNotification } from '@shared/notifications';
import type { ApiFetch } from './api';

/** Fired on window when the user opens a notification, so the header count updates. */
export const NOTIFICATIONS_CHANGED = 'perdi-u:notifications-changed';

export type NotificationsService = {
  list: () => Promise<AppNotification[]>;
  markRead: (id: string) => Promise<void>;
};

export function createNotificationsService(apiFetch: ApiFetch): NotificationsService {
  return {
    list: async () => {
      const response = await apiFetch('/me/notifications');
      if (!response.ok) {
        throw new Error('No se pudieron cargar tus avisos. Intenta nuevamente.');
      }
      return response.json();
    },
    markRead: async (id) => {
      const response = await apiFetch(`/me/notifications/${encodeURIComponent(id)}/read`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('No se pudo marcar el aviso como leído.');
      }
    },
  };
}
