import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/inter';
import './index.css';
import App from './App';
import { createAuthService } from './core/data/authService';
import { supabase } from './core/data/supabase';

const authService = createAuthService({
  auth: supabase.auth,
  apiUrl: import.meta.env.VITE_API_URL,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App authService={authService} />
    </BrowserRouter>
  </StrictMode>,
);
