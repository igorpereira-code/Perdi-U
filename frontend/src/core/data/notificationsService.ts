import type { AppNotification } from '@shared/notifications';
import type { ApiFetch } from './api';

export type NotificationsService = {
  list: () => Promise<AppNotification[]>;
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
  };
}
