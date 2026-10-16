import express from 'express';
import cors from 'cors';
import { APP_NAME } from '@shared/constants';
import { createCurrentUser, getCurrentUser, type VerifyToken } from './core/currentUser';
import { verifySupabaseToken } from './core/data/supabaseAuth';

type AppOptions = {
  verifyToken?: VerifyToken;
};

export function createApp({ verifyToken = verifySupabaseToken }: AppOptions = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', app: APP_NAME });
  });

  app.use(createCurrentUser(verifyToken));

  app.get('/me', (req, res) => {
    res.json(getCurrentUser(req));
  });

  return app;
}
