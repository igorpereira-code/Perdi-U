import { Route, Routes } from 'react-router-dom';
import { APP_NAME } from '@shared/constants';
import { signInWithGoogle } from './core/data/auth';
import { supabase } from './core/data/supabase';
import { LoginPage } from './core/presenter/LoginPage';

function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-50 p-4">
      <h1 className="text-2xl font-bold text-blue-700">{APP_NAME}</h1>
      <p className="text-neutral-500">¿Lo perdi-U? ¡Lo encontr-U!</p>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/ingresar"
        element={<LoginPage onGoogleLogin={() => signInWithGoogle(supabase.auth)} />}
      />
    </Routes>
  );
}
