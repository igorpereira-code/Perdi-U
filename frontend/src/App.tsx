import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { AppUser } from '@shared/user';
import { NotInstitutionalEmailError, type AuthService } from './core/data/authService';
import { AppLayout } from './core/presenter/AppLayout';
import { HomePage } from './core/presenter/HomePage';
import { LoginPage } from './core/presenter/LoginPage';
import { ProfilePage } from './core/presenter/ProfilePage';
import type { MatchesService } from './matching/data/matchesService';
import { MatchesScreen } from './matching/presenter/MatchesScreen';
import type { GuideService } from './finder/data/guideService';
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


type AppProps = {
  authService: AuthService;
  matchesService: MatchesService;
  guideService: GuideService;
  foundItemsService: FoundItemsService;
  welfareService: WelfareService;
  lostReportsService: LostReportsService;
  catalogService: CatalogService;
};

export default function App({
  authService,
  matchesService,
  guideService,
  foundItemsService,
  welfareService,
  lostReportsService,
  catalogService,
}: AppProps) {
  // undefined = still checking who is signed in; null = nobody is signed in.
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user, setUser] = useState<AppUser | null | undefined>(undefined);
  const [notInstitutional, setNotInstitutional] = useState(false);
  const guidePending = user ? !user.hasSeenGuide : false;

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .catch((error: unknown) => {
        setNotInstitutional(error instanceof NotInstitutionalEmailError);
        setUser(null);
      });
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
  const signedInPage = (page: (me: AppUser) => ReactNode) => {
    if (user === undefined) {
      return null;
    }
    if (user === null) {
      return <Navigate to="/ingresar" replace />;
    }
    
    if (guidePending && pathname !== '/guia-rapida') {
      return <Navigate to="/guia-rapida" replace />;
    }
    return <AppLayout role={user.role}>{page(user)}</AppLayout>;
  };

  return (
    <Routes>
      <Route
        path="/"
        element={signedInPage((me) => (
          <div className="mx-auto max-w-xl space-y-6">
            <HomePage user={me} />
            <div className="grid grid-cols-2 gap-3">
              <FoundItemEntry onClick={() => navigate('/reportar-objeto')} />
              <LostItemEntry onClick={() => navigate('/reportar-perdida')} />
            </div>
            <Link to="/mis-reportes" className="inline-flex min-h-11 items-center rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-blue-700">Mis reportes</Link>
            <CatalogSection catalogService={catalogService} foundItemsService={foundItemsService} />
          </div>
        ))}
      />
             <Route
        path="/reportar-objeto"
        element={signedInPage(() => (
          <FoundItemScreen foundItemsService={foundItemsService} />
        ))}
      />
      <Route
        path="/reportar-perdida"
        element={signedInPage(() => (
          <LostReportScreen
            foundItemsService={foundItemsService}
            lostReportsService={lostReportsService}
          />
        ))}
      />
      <Route
        path="/perfil"
        element={signedInPage((me) => (
          <ProfilePage user={me} onSignOut={handleSignOut} />
        ))}
      />
      <Route
        path="/mis-reportes"
        element={signedInPage(() => <MyFoundItemsScreen foundItemsService={foundItemsService} />)}
      />
      <Route
        path="/mis-reportes/encontrados/:code"
        element={signedInPage(() => <MyFoundItemScreen foundItemsService={foundItemsService} />)}
      />
      <Route
        path="/mis-reportes/:code/coincidencias"
        element={signedInPage(() => <MatchesScreen matchesService={matchesService} />)}
      />
      <Route
        path="/guia-rapida"
        element={signedInPage(() => (
          <QuickGuideScreen guideService={guideService} onSeen={handleGuideSeen} />
        ))}
      />
      <Route
        path="/bienestar"
        element={signedInPage((me) =>
          me.role === 'WELFARE' ? (
            <WelfarePage welfareService={welfareService} matchesService={matchesService} />
          ) : (
            <Navigate to="/" replace />
          ),
        )}
      />
      <Route
        path="/ingresar"
        element={
          guidePending ? (
            <Navigate to="/guia-rapida" replace />
          ) : (
            <LoginPage onGoogleLogin={authService.signIn} notInstitutional={notInstitutional} />
          )
        }
      />
    </Routes>
  );
}