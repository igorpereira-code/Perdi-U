import { useCallback } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AppNotification } from '@shared/notifications';
import { NOTIFICATIONS_CHANGED, type NotificationsService } from '../data/notificationsService';
import { formatNotificationTime } from '../logic/formatNotificationTime';
import { getNotificationDestination } from '../logic/getNotificationDestination';
import { markNotificationRead } from '../logic/markNotificationRead';
import { EmptyState } from './EmptyState';
import { LoadErrorAlert } from './LoadErrorAlert';
import { Skeleton, SkeletonArea } from './Skeleton';
import { useLoadedData } from './useLoadedData';

type NotificationsScreenProps = {
  notificationsService: NotificationsService;
};

const SKELETON_ROWS = 3;

function NotificationsSkeleton() {
  return (
    <SkeletonArea label="Cargando tus avisos…">
      <ul className="space-y-3">
        {Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
          <li
            key={rowIndex}
            className="space-y-2 rounded-2xl border border-neutral-200 bg-neutral-0 p-4"
          >
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-16" />
          </li>
        ))}
      </ul>
    </SkeletonArea>
  );
}

type NotificationItemProps = {
  notification: AppNotification;
  onOpen: (notification: AppNotification) => void;
};

function NotificationItem({ notification, onOpen }: NotificationItemProps) {
  const isNew = notification.readAt === null;
  const destination = getNotificationDestination(notification.link);
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left hover:bg-blue-50 ${
          isNew ? 'border-blue-200 bg-blue-50' : 'border-neutral-200 bg-neutral-0'
        }`}
      >
        {isNew && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-yellow-500" aria-label="Nuevo" />
        )}
        <span className="min-w-0 flex-1">
          <span className={`block text-sm text-neutral-900 ${isNew ? 'font-semibold' : ''}`}>
            {notification.message}
          </span>
          <span className="mt-1 block text-xs text-neutral-500">
            <time dateTime={notification.createdAt}>
              {formatNotificationTime(notification.createdAt)}
            </time>
          </span>
        </span>
        {destination && (
          <ChevronRight className="h-5 w-5 shrink-0 text-blue-300" aria-hidden="true" />
        )}
      </button>
    </li>
  );
}

/** The user's notifications. */
export function NotificationsScreen({ notificationsService }: NotificationsScreenProps) {
  const loadNotifications = useCallback(() => notificationsService.list(), [notificationsService]);
  const {
    data: notifications,
    setData: setNotifications,
    hasFailed,
    retry,
  } = useLoadedData(loadNotifications);
  const navigate = useNavigate();

  /** Saves that it was read and tells the bell to update its count. */
  async function saveAsRead(notification: AppNotification) {
    if (notification.readAt !== null) {
      return;
    }
    await notificationsService.markRead(notification.id).catch(() => undefined);
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
  }

  function goToDestination(notification: AppNotification) {
    const destination = getNotificationDestination(notification.link);
    if (destination) {
      navigate(destination);
    }
  }

  async function openNotification(notification: AppNotification) {
    setNotifications((current) => current && markNotificationRead(current, notification.id));
    await saveAsRead(notification);
    goToDestination(notification);
  }

  function renderNotifications() {
    if (hasFailed) {
      return (
        <LoadErrorAlert
          message="No se pudieron cargar tus avisos. Intenta nuevamente."
          onRetry={retry}
        />
      );
    }
    if (notifications === undefined) {
      return <NotificationsSkeleton />;
    }
    if (notifications.length === 0) {
      return (
        <EmptyState
          icon={Bell}
          title="Todavía no tienes avisos"
          text="Aquí verás lo que pase con tus reportes, por ejemplo cuando Bienestar reciba un objeto."
        />
      );
    }
    return (
      <ul aria-label="Mis avisos" className="space-y-3">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onOpen={(opened) => void openNotification(opened)}
          />
        ))}
      </ul>
    );
  }

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-semibold text-blue-700">Avisos</h1>
      {renderNotifications()}
    </section>
  );
}
