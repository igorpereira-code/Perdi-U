import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { AppUser } from '@shared/user';
import { NotInstitutionalEmailError, type AuthService } from './core/data/authService';
import { AppLayout } from './core/presenter/AppLayout';
import { HomePage } from './core/presenter/HomePage';
import { Button } from './core/presenter/Button';
import { LoginPage } from './core/presenter/LoginPage';
import { ProfilePage } from './core/presenter/ProfilePage';
import type { MatchesService } from './matching/data/matchesService';
import { MatchesScreen } from './matching/presenter/MatchesScreen';
import type { GuideService } from './finder/data/guideService';
import { QuickGuide } from './finder/presenter/QuickGuide';
import { QuickGuideScreen } from './finder/presenter/QuickGuideScreen';
import { FoundItemEntry } from './finder/presenter/FoundItemEntry';
import { FoundItemScreen } from './finder/presenter/FoundItemScreen';
import type { FoundItemsService } from './finder/data/foundItemsService';
import { MyFoundItemsScreen } from './finder/presenter/MyFoundItemsScreen';
import { MyFoundItemScreen } from './finder/presenter/MyFoundItemScreen';
import type { WelfareService } from './welfare/data/welfareService';
import { WelfarePage } from './welfare/presenter/WelfarePage';
import type { LostReportsService } from './owner/data/lostReportsService';
import { LostItemEntry } from './owner/presenter/LostItemEntry';
import { LostReportScreen } from './owner/presenter/LostReportScreen';
import type { CatalogService } from './owner/data/catalogService';
import { CatalogSection } from './owner/presenter/CatalogSection';
import { CatalogItemScreen } from './owner/presenter/CatalogItemScreen';
import type { MyLostReportsService } from './owner/data/myLostReportsService';
import { MyLostReportsScreen } from './owner/presenter/MyLostReportsScreen';
import { MyLostReportScreen } from './owner/presenter/MyLostReportScreen';
import type { NotificationsService } from './core/data/notificationsService';
import { NotificationsBell } from './core/presenter/NotificationsBell';
import { NotificationsScreen } from './core/presenter/NotificationsScreen';
import { AppLoadingScreen } from './core/presenter/AppLoadingScreen';
import { canManageUsers } from './admin/logic/canManageUsers';
import { AdminPage } from './admin/presenter/AdminPage';
import type { AdminUsersService } from './admin/data/adminUsersService';
import { canUseWelfareOptions } from './core/logic/canUseWelfareOptions';
import { withRefreshedRole } from './core/logic/withRefreshedRole';

type AppProps = {
  authService: AuthService;
  matchesService: MatchesService;
  guideService: GuideService;
  foundItemsService: FoundItemsService;
  welfareService: WelfareService;
  lostReportsService: LostReportsService;
  catalogService: CatalogService;
  myLostReportsService: MyLostReportsService;
  notificationsService?: NotificationsService;
  adminUsersService?: AdminUsersService;
};

export default function App({
  authService,
  matchesService,
  guideService,
  foundItemsService,
  welfareService,
  lostReportsService,
  catalogService,
  myLostReportsService,
  notificationsService,
  adminUsersService,
}: AppProps) {
  // undefined = still checking who is signed in; null = nobody is signed in.
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user, setUser] = useState<AppUser | null | undefined>(undefined);
  const [isNotInstitutional, setIsNotInstitutional] = useState(false);
  const isGuidePending = user ? !user.hasSeenGuide : false;
  const ROLE_REFRESH_INTERVAL_MS = 30 * 1000;

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .catch((error: unknown) => {
        setIsNotInstitutional(error instanceof NotInstitutionalEmailError);
        setUser(null);
      });
  }, [authService]);
  // The Administrator can give or take away the Bienestar role while the app is open,
  // so the role is checked again every 30 seconds and every time the user comes back to the app.
  useEffect(() => {
    function refreshRole() {
      if (document.visibilityState !== 'visible') {
        return;
      }
      authService
        .getCurrentUser()
        .then((refreshedUser) =>
          setUser((currentUser) =>
            currentUser ? withRefreshedRole(currentUser, refreshedUser) : currentUser,
          ),
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
  }, [authService]);

  async function handleSignOut() {
    await authService.signOut();
    setUser(null);
  }

  function handleGuideSeen() {
    setUser((current) => (current ? { ...current, hasSeenGuide: true } : current));
    navigate('/', { replace: true });
  }

  /** Pages for signed-in users: inside the blue header and bottom menu. Without a session, go to sign in. */
  const renderSignedInPage = (page: (signedInUser: AppUser) => ReactNode) => {
    if (user === undefined) {
      return <AppLoadingScreen />;
    }
    if (user === null) {
      return <Navigate to="/ingresar" replace />;
    }
    if (isGuidePending && pathname !== '/guia-rapida') {
      return <Navigate to="/guia-rapida" replace />;
    }
    return (
      <AppLayout
        role={user.role}
        headerAction={
          notificationsService && <NotificationsBell notificationsService={notificationsService} />
        }
      >
        {page(user)}
      </AppLayout>
    );
  };

  return (
    <Routes>
      <Route
        path="/"
        element={renderSignedInPage((signedInUser) => (
          <div className="mx-auto max-w-xl space-y-6">
            <HomePage user={signedInUser} />
            <div className="grid grid-cols-2 gap-3">
              <FoundItemEntry onClick={() => navigate('/reportar-objeto')} />
              <LostItemEntry onClick={() => navigate('/reportar-perdida')} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate('/guia-rapida')}>
                Ver guía
              </Button>
              <Link
                to="/mis-reportes"
                className="inline-flex min-h-11 items-center rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-blue-700"
              >
                Mis reportes
              </Link>
              <Link
                to="/mis-perdidas"
                className="inline-flex min-h-11 items-center rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-blue-700"
              >
                Mis reportes de pérdida
              </Link>
            </div>
            <CatalogSection catalogService={catalogService} foundItemsService={foundItemsService} />
          </div>
        ))}
      />
      <Route
        path="/reportar-objeto"
        element={renderSignedInPage(() => (
          <FoundItemScreen foundItemsService={foundItemsService} />
        ))}
      />
      <Route
        path="/reportar-perdida"
        element={renderSignedInPage(() => (
          <LostReportScreen
            foundItemsService={foundItemsService}
            lostReportsService={lostReportsService}
          />
        ))}
      />
      <Route
        path="/objetos/:code"
        element={renderSignedInPage(() => (
          <CatalogItemScreen
            catalogService={catalogService}
            foundItemsService={foundItemsService}
          />
        ))}
      />
      <Route
        path="/mis-perdidas"
        element={renderSignedInPage(() => (
          <MyLostReportsScreen myLostReportsService={myLostReportsService} />
        ))}
      />
      <Route
        path="/mis-perdidas/:code"
        element={renderSignedInPage(() => (
          <MyLostReportScreen myLostReportsService={myLostReportsService} />
        ))}
      />
      <Route
        path="/perfil"
        element={renderSignedInPage((signedInUser) => (
          <ProfilePage user={signedInUser} onSignOut={handleSignOut} />
        ))}
      />
      <Route
        path="/mis-reportes"
        element={renderSignedInPage(() => (
          <MyFoundItemsScreen foundItemsService={foundItemsService} />
        ))}
      />
      <Route
        path="/mis-reportes/encontrados/:code"
        element={renderSignedInPage(() => (
          <MyFoundItemScreen foundItemsService={foundItemsService} />
        ))}
      />
      <Route
        path="/mis-reportes/:code/coincidencias"
        element={renderSignedInPage(() => (
          <MatchesScreen matchesService={matchesService} />
        ))}
      />
      {notificationsService && (
        <Route
          path="/avisos"
          element={renderSignedInPage(() => (
            <NotificationsScreen notificationsService={notificationsService} />
          ))}
        />
      )}
      <Route
        path="/guia-rapida"
        element={renderSignedInPage((me) =>
          me.hasSeenGuide ? (
            <QuickGuide onClose={() => navigate('/', { replace: true })} />
          ) : (
            <QuickGuideScreen guideService={guideService} onSeen={handleGuideSeen} />
          ),
        )}
      />
      <Route
        path="/bienestar"
        element={renderSignedInPage((signedInUser) =>
          canUseWelfareOptions(signedInUser.role) ? (
            <WelfarePage welfareService={welfareService} matchesService={matchesService} />
          ) : (
            <Navigate to="/" replace />
          ),
        )}
      />
      {adminUsersService && (
        <Route
          path="/administracion"
          element={renderSignedInPage((signedInUser) =>
            canManageUsers(signedInUser.role) ? (
              <AdminPage adminUsersService={adminUsersService} />
            ) : (
              <Navigate to="/" replace />
            ),
          )}
        />
      )}
      <Route
        path="/ingresar"
        element={
          isGuidePending ? (
            <Navigate to="/guia-rapida" replace />
          ) : (
            <LoginPage onGoogleLogin={authService.signIn} isNotInstitutional={isNotInstitutional} />
          )
        }
      />
    </Routes>
  );
}
