import { useEffect, useState } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AppNotification } from '@shared/notifications';
import type { NotificationsService } from '../data/notificationsService';
import { notificationTime } from '../logic/notificationTime';
import { notificationDestination } from '../logic/notificationDestination';
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
            const destination = notificationDestination(notification.link);
            const content = (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-neutral-900">{notification.message}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    <time dateTime={notification.createdAt}>
                      {notificationTime(notification.createdAt)}
                    </time>
                  </p>
                </div>
                {destination && (
                  <ChevronRight className="h-5 w-5 shrink-0 text-blue-300" aria-hidden="true" />
                )}
              </>
            );
            const style =
              'flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4';
            return (
              <li key={notification.id}>
                {destination ? (
                  <Link to={destination} className={`${style} hover:bg-blue-50`}>
                    {content}
                  </Link>
                ) : (
                  <div className={style}>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
