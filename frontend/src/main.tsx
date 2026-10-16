import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/inter';
import './index.css';
import App from './App';
import { createApiFetch } from './core/data/api';
import { createAuthService } from './core/data/authService';
import { supabase } from './core/data/supabase';
import { createMatchesService } from './matching/data/matchesService';

const apiUrl = import.meta.env.VITE_API_URL;
const authService = createAuthService({ auth: supabase.auth, apiUrl });
const apiFetch = createApiFetch({ auth: supabase.auth, apiUrl });
const matchesService = createMatchesService(apiFetch);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App authService={authService} matchesService={matchesService} />
    </BrowserRouter>
  </StrictMode>,
);
