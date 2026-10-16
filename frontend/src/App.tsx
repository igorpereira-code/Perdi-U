import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import type { AppUser } from '@shared/user';
import type { AuthService } from './core/data/authService';
import { HomePage } from './core/presenter/HomePage';
import { LoginPage } from './core/presenter/LoginPage';

export default function App({ authService }: { authService: AuthService }) {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then(setUser);
  }, [authService]);

  return (
    <Routes>
      <Route path="/" element={user ? <HomePage user={user} /> : null} />
      <Route path="/ingresar" element={<LoginPage onGoogleLogin={authService.signIn} />} />
    </Routes>
  );
}
