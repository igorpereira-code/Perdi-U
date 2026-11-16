import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppUser } from '@shared/user';
import { getStartPath } from '../logic/getStartPath';

/**
 * Right after signing in, takes each user to their start page (the Administrator, to
 * Administración). Only once per sign-in: afterwards "Inicio" works as usual.
 */
export function useStartPage(user: AppUser | null | undefined) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const hasOpenedStartPage = useRef(false);

  useEffect(() => {
    if (!user) {
      hasOpenedStartPage.current = false;
      return;
    }
    if (hasOpenedStartPage.current) {
      return;
    }
    hasOpenedStartPage.current = true;
    const startPath = getStartPath(user.role);
    if (pathname === '/' && startPath !== '/') {
      navigate(startPath, { replace: true });
    }
  }, [user, pathname, navigate]);
}
