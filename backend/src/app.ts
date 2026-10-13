import express from 'express';
import cors from 'cors';
import { APP_NAME } from '@shared/constants';
import { currentUser, getCurrentUser } from './core/currentUser';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', app: APP_NAME });
  });

  app.use(currentUser);

  app.get('/me', (req, res) => {
    res.json(getCurrentUser(req));
  });

  return app;
}
