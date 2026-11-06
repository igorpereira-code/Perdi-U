import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { NOTIFICATIONS_CHANGED, type NotificationsService } from '../data/notificationsService';
import { countUnread, unreadBadgeText } from '../logic/unreadNotifications';

type NotificationsBellProps = {
  notificationsService: Pick<NotificationsService, 'list'>;
};

/** The "Avisos" option in the header, with how many new notifications the user has. */
export function NotificationsBell({ notificationsService }: NotificationsBellProps) {
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);
  const [changes, setChanges] = useState(0);

  useEffect(() => {
    const refresh = () => setChanges((value) => value + 1);
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, refresh);
  }, []);

  // Checked again on every screen change and when a notification is opened, so the number stays up to date.
  useEffect(() => {
    let active = true;
    notificationsService
      .list()
      .then((notifications) => {
        if (active) {
          setUnread(countUnread(notifications));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [notificationsService, pathname, changes]);

  const badge = unreadBadgeText(unread);

  return (
    <Link
      to="/avisos"
      aria-label={badge ? `Avisos, ${unread} nuevos` : 'Avisos'}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-0 hover:bg-blue-500"
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {badge && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500 px-1 text-xs font-semibold text-blue-700"
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
