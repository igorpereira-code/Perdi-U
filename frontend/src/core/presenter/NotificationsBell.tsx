import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { NOTIFICATIONS_CHANGED, type NotificationsService } from '../data/notificationsService';
import { countUnread, formatUnreadBadge } from '../logic/unreadNotifications';

type NotificationsBellProps = {
  notificationsService: Pick<NotificationsService, 'list'>;
};

/** The "Avisos" option in the header, with how many new notifications the user has. */
export function NotificationsBell({ notificationsService }: NotificationsBellProps) {
  const { pathname } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [changeCount, setChangeCount] = useState(0);

  useEffect(() => {
    const refreshUnreadCount = () => setChangeCount((value) => value + 1);
    window.addEventListener(NOTIFICATIONS_CHANGED, refreshUnreadCount);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, refreshUnreadCount);
  }, []);

  // Checked again on every screen change and when a notification is opened, so the number stays up to date.
  useEffect(() => {
    let active = true;
    notificationsService
      .list()
      .then((notifications) => {
        if (active) {
          setUnreadCount(countUnread(notifications));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [notificationsService, pathname, changeCount]);

  const badgeText = formatUnreadBadge(unreadCount);

  return (
    <Link
      to="/avisos"
      aria-label={badgeText ? `Avisos, ${unreadCount} nuevos` : 'Avisos'}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-0 hover:bg-blue-500"
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {badgeText && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500 px-1 text-xs font-semibold text-blue-700"
        >
          {badgeText}
        </span>
      )}
    </Link>
  );
}
