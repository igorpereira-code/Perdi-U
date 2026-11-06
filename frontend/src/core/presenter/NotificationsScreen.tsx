import { useEffect, useState } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AppNotification } from '@shared/notifications';
import { NOTIFICATIONS_CHANGED, type NotificationsService } from '../data/notificationsService';
import { notificationTime } from '../logic/notificationTime';
import { notificationDestination } from '../logic/notificationDestination';
import { markNotificationRead } from '../logic/markNotificationRead';
import { Alert } from './Alert';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

type NotificationsScreenProps = {
  notificationsService: NotificationsService;
};

/** The user's notifications. */
export function NotificationsScreen({ notificationsService }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();

  async function open(notification: AppNotification) {
    setNotifications((current) => current && markNotificationRead(current, notification.id));
    if (notification.readAt === null) {
      await notificationsService.markRead(notification.id).catch(() => undefined);
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
    }
    const destination = notificationDestination(notification.link);
    if (destination) {
      navigate(destination);
    }
  }

  useEffect(() => {
    let active = true;
    setNotifications(null);
    setFailed(false);
    notificationsService
      .list()
      .then((data) => {
        if (active) {
          setNotifications(data);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [notificationsService, attempt]);

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-semibold text-blue-700">Avisos</h1>
      {failed ? (
        <div className="space-y-3">
          <div role="alert">
            <Alert>No se pudieron cargar tus avisos. Intenta nuevamente.</Alert>
          </div>
          <Button onClick={() => setAttempt((value) => value + 1)}>Reintentar</Button>
        </div>
      ) : notifications === null ? (
        <p role="status" className="text-sm text-neutral-500">
          Cargando tus avisos…
        </p>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Todavía no tienes avisos"
          text="Aquí verás lo que pase con tus reportes, por ejemplo cuando Bienestar reciba un objeto."
        />
      ) : (
        <ul aria-label="Mis avisos" className="space-y-3">
          {notifications.map((notification) => {
            const isNew = notification.readAt === null;
            const destination = notificationDestination(notification.link);
            return (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => void open(notification)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left hover:bg-blue-50 ${
                    isNew ? 'border-blue-200 bg-blue-50' : 'border-neutral-200 bg-neutral-0'
                  }`}
                >
                  {isNew && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-yellow-500"
                      aria-label="Nuevo"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm text-neutral-900 ${isNew ? 'font-semibold' : ''}`}
                    >
                      {notification.message}
                    </span>
                    <span className="mt-1 block text-xs text-neutral-500">
                      <time dateTime={notification.createdAt}>
                        {notificationTime(notification.createdAt)}
                      </time>
                    </span>
                  </span>
                  {destination && (
                    <ChevronRight className="h-5 w-5 shrink-0 text-blue-300" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
