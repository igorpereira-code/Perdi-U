import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { AppUser } from '@shared/user';
import type { AuthService } from '../data/authService';
import { withRefreshedRole } from '../logic/withRefreshedRole';

const ROLE_REFRESH_INTERVAL_MS = 30 * 1000;

type SetUser = Dispatch<SetStateAction<AppUser | null | undefined>>;

/**
 * The Administrator can give or take away the Bienestar role while the app is open,
 * so the role is checked again every 30 seconds and every time the user comes back to the app.
 */
export function useRoleRefresh(authService: AuthService, setUser: SetUser) {
  useEffect(() => {
    function refreshRole() {
      if (document.visibilityState !== 'visible') {
        return;
      }
      authService
        .getCurrentUser()
        .then((refreshedUser) =>
          setUser((currentUser) => currentUser && withRefreshedRole(currentUser, refreshedUser)),
        )
        .catch(() => undefined);
    }

    const refreshTimer = window.setInterval(refreshRole, ROLE_REFRESH_INTERVAL_MS);
    window.addEventListener('focus', refreshRole);
    document.addEventListener('visibilitychange', refreshRole);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', refreshRole);
      document.removeEventListener('visibilitychange', refreshRole);
    };
  }, [authService, setUser]);
}
