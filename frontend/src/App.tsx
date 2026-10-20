import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import type { AppUser } from '@shared/user';
import { NotInstitutionalEmailError, type AuthService } from './core/data/authService';
import { AppLayout } from './core/presenter/AppLayout';
import { HomePage } from './core/presenter/HomePage';
import { LoginPage } from './core/presenter/LoginPage';
import { ProfilePage } from './core/presenter/ProfilePage';
import type { MatchesService } from './matching/data/matchesService';
import { MatchesScreen } from './matching/presenter/MatchesScreen';
import { FoundItemEntry } from './finder/presenter/FoundItemEntry';
import { FoundItemScreen } from './finder/presenter/FoundItemScreen';
import type { FoundItemsService } from './finder/data/foundItemsService';

type AppProps = {
  authService: AuthService;
  matchesService: MatchesService;
  foundItemsService: FoundItemsService;
};

export default function App({ authService, matchesService, foundItemsService }: AppProps) {
  const navigate = useNavigate();
  // undefined = still checking who is signed in; null = nobody is signed in.
  const [user, setUser] = useState<AppUser | null | undefined>(undefined);
  const [notInstitutional, setNotInstitutional] = useState(false);

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

  /** Pages for signed-in users: inside the blue header and bottom menu. Without a session, go to sign in. */
  const signedInPage = (page: (me: AppUser) => ReactNode) => {
    if (user === undefined) {
      return null;
    }
    if (user === null) {
      return <Navigate to="/ingresar" replace />;
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
        element={signedInPage(() => (
          <MatchesScreen matchesService={matchesService} />
        ))}
      />
      <Route
        path="/ingresar"
        element={
          <LoginPage onGoogleLogin={authService.signIn} notInstitutional={notInstitutional} />
        }
      />
    </Routes>
  );
}
