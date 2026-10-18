import express from 'express';
import cors from 'cors';
import { APP_NAME } from '@shared/constants';
import { createCurrentUser, getCurrentUser, type VerifyToken } from './core/currentUser';
import { verifySupabaseToken } from './core/data/supabaseAuth';
import { prismaUsersRepository } from './core/data/prismaUsersRepository';
import type { UsersRepository } from './core/data/usersRepository';
import type { MatchingRepository } from './matching/data/matchingRepository';
import { prismaMatchingRepository } from './matching/data/prismaMatchingRepository';
import { createMatchesRouter } from './matching/routes/matchesRouter';
import { createPublishRouter } from './matching/routes/publishRouter';
import { createGuideRouter } from './finder/routes/guideRouter';

type AppOptions = {
  verifyToken?: VerifyToken;
  users?: UsersRepository;
  allowSampleUsers?: boolean;
  matching?: MatchingRepository;
};
export function createApp({
  verifyToken = verifySupabaseToken,
  users = prismaUsersRepository,
  allowSampleUsers = process.env.ALLOW_SAMPLE_USERS === 'true',
  matching = prismaMatchingRepository,
}: AppOptions = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', app: APP_NAME });
  });

  app.use(createCurrentUser(verifyToken, users, allowSampleUsers));

  app.get('/me', (req, res) => {
    res.json(getCurrentUser(req));
  });
  app.use(createGuideRouter(users));
  app.use(createMatchesRouter(matching));
  app.use(createPublishRouter(matching));

  return app;
}
