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
import { createGuideService } from './finder/data/guideService';
import { createFoundItemsService } from './finder/data/foundItemsService';
import { createWelfareService } from './welfare/data/welfareService';

const apiUrl = import.meta.env.VITE_API_URL;
const authService = createAuthService({ auth: supabase.auth, apiUrl });
const apiFetch = createApiFetch({ auth: supabase.auth, apiUrl });
const matchesService = createMatchesService(apiFetch);
const guideService = createGuideService(apiFetch);
const foundItemsService = createFoundItemsService(apiFetch);
const welfareService = createWelfareService(apiFetch);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App
        authService={authService}
        matchesService={matchesService}
        guideService={guideService}
        foundItemsService={foundItemsService}
        welfareService={welfareService}
      />
    </BrowserRouter>
  </StrictMode>,
);
