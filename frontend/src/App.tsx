import { useEffect, useState, type ReactNode } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import type { AppUser } from '@shared/user';
import { NotInstitutionalEmailError, type AuthService } from './core/data/authService';
import { AppLayout } from './core/presenter/AppLayout';
import { HomePage } from './core/presenter/HomePage';
import { LoginPage } from './core/presenter/LoginPage';
import { ProfilePage } from './core/presenter/ProfilePage';

export default function App({ authService }: { authService: AuthService }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AppUser | null>(null);
  const [notInstitutional, setNotInstitutional] = useState(false);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .catch((error: unknown) => {
        if (error instanceof NotInstitutionalEmailError) {
          setNotInstitutional(true);
          navigate('/ingresar');
        }
      });
  }, [authService, navigate]);

  /** Pages for signed-in users: they go inside the blue header and the bottom menu. */
  const signedInPage = (page: (me: AppUser) => ReactNode) =>
    user ? <AppLayout>{page(user)}</AppLayout> : null;

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
          <ProfilePage user={me} />
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
