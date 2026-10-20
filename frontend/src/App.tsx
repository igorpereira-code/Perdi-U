import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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

type AppProps = {
  authService: AuthService;
  matchesService: MatchesService;
  guideService: GuideService;
  foundItemsService: FoundItemsService;
};

export default function App({ authService, matchesService, guideService, foundItemsService }: AppProps) {
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
    return <AppLayout>{page(user)}</AppLayout>;
  };

  return (
    <Routes>
      <Route
        path="/"
        element={signedInPage((me) => (
          <div className="space-y-6">
            <HomePage user={me} />
            <FoundItemEntry onClick={() => navigate('/reportar-objeto')} />
          </div>
        ))}
      />
      <Route
        path="/reportar-objeto"
        element={signedInPage(() => <FoundItemScreen foundItemsService={foundItemsService} />)}
      />
      <Route
        path="/perfil"
        element={signedInPage((me) => (
          <ProfilePage user={me} onSignOut={handleSignOut} />
        ))}
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
