import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { AppUser } from '@shared/user';
import { NotInstitutionalEmailError, type AuthService } from './core/data/authService';
import { AppLayout } from './core/presenter/AppLayout';
import { HomePage } from './core/presenter/HomePage';
import { LoginPage } from './core/presenter/LoginPage';
import { ProfilePage } from './core/presenter/ProfilePage';

export default function App({ authService }: { authService: AuthService }) {
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
        path="/ingresar"
        element={
          <LoginPage onGoogleLogin={authService.signIn} notInstitutional={notInstitutional} />
        }
      />
    </Routes>
  );
}
