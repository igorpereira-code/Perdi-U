import express from 'express';
import cors from 'cors';
import { APP_NAME } from '@shared/constants';
import { createCurrentUser, getCurrentUser, type VerifyToken } from './core/currentUser';
import { verifySupabaseToken } from './core/data/supabaseAuth';
import { prismaUsersRepository } from './core/data/prismaUsersRepository';
import type { UsersRepository } from './core/data/usersRepository';

type AppOptions = {
  verifyToken?: VerifyToken;
  users?: UsersRepository;
};

export function createApp({
  verifyToken = verifySupabaseToken,
  users = prismaUsersRepository,
}: AppOptions = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', app: APP_NAME });
  });

  app.use(createCurrentUser(verifyToken, users));

  app.get('/me', (req, res) => {
    res.json(getCurrentUser(req));
  });

  return app;
}
