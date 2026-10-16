import { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import type { AppUser } from '@shared/user';
import { NotInstitutionalEmailError, type AuthService } from './core/data/authService';
import { HomePage } from './core/presenter/HomePage';
import { LoginPage } from './core/presenter/LoginPage';

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

  return (
    <Routes>
      <Route path="/" element={user ? <HomePage user={user} /> : null} />
      <Route
        path="/ingresar"
        element={
          <LoginPage onGoogleLogin={authService.signIn} notInstitutional={notInstitutional} />
        }
      />
    </Routes>
  );
}
