import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { AppUser } from '@shared/user';
import { NotInstitutionalEmailError, type AuthService } from './core/data/authService';
import { AppLayout } from './core/presenter/AppLayout';
import { HomePage } from './core/presenter/HomePage';
import { LoginPage } from './core/presenter/LoginPage';
import { ProfilePage } from './core/presenter/ProfilePage';
import type { MatchesService } from './matching/data/matchesService';
import { MatchesScreen } from './matching/presenter/MatchesScreen';
import type { WelfareService } from './welfare/data/welfareService';
import { WelfarePage } from './welfare/presenter/WelfarePage';

type AppProps = {
  authService: AuthService;
  matchesService: MatchesService;
  welfareService: WelfareService;
};

export default function App({ authService, matchesService, welfareService }: AppProps) {
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
    return <AppLayout role={user.role}>{page(user)}</AppLayout>;
  };

  return (
    <Routes>
      <Route
        path="/"
        element={signedInPage((me) => (
          <HomePage user={me} />
        ))}
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
          <LoginPage onGoogleLogin={authService.signIn} notInstitutional={notInstitutional} />
        }
      />
    </Routes>
  );
}
