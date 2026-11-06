import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

/** The "Avisos" option in the header. */
export function NotificationsBell() {
  return (
    <Link
      to="/avisos"
      aria-label="Avisos"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-0 hover:bg-blue-500"
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
    </Link>
  );
}
