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
import type { FoundItemsRepository } from './finder/data/foundItemsRepository';
import { prismaFoundItemsRepository } from './finder/data/prismaFoundItemsRepository';
import { createFoundItemsRouter } from './finder/routes/foundItemsRouter';
import type { FoundItemPhotoStorage } from './finder/data/foundItemPhotoStorage';
import { supabaseFoundItemPhotoStorage } from './finder/data/supabaseFoundItemPhotoStorage';
import type { WelfareRepository } from './welfare/data/welfareRepository';
import { createReceivedItemsRouter } from './welfare/routes/receivedItemsRouter';
import { prismaWelfareRepository } from './welfare/data/prismaWelfareRepository';
import type { LostReportsRepository } from './owner/data/lostReportsRepository';
import { prismaLostReportsRepository } from './owner/data/prismaLostReportsRepository';
import { createLostReportsRouter } from './owner/routes/lostReportsRouter';
import type { CatalogRepository } from './owner/data/catalogRepository';
import { prismaCatalogRepository } from './owner/data/prismaCatalogRepository';
import { createCatalogRouter } from './owner/routes/catalogRouter';

type AppOptions = {
  verifyToken?: VerifyToken;
  users?: UsersRepository;
  allowSampleUsers?: boolean;
  matching?: MatchingRepository;
  foundItems?: FoundItemsRepository;
  foundItemPhotos?: FoundItemPhotoStorage;
  welfare?: WelfareRepository;
  lostReports?: LostReportsRepository;
  catalog?: CatalogRepository;
};
export function createApp({
  verifyToken = verifySupabaseToken,
  users = prismaUsersRepository,
  allowSampleUsers = process.env.ALLOW_SAMPLE_USERS === 'true',
  matching = prismaMatchingRepository,
  foundItems = prismaFoundItemsRepository,
  foundItemPhotos = supabaseFoundItemPhotoStorage,
  welfare = prismaWelfareRepository,
  lostReports = prismaLostReportsRepository,
  catalog = prismaCatalogRepository,
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
  app.use(createFoundItemsRouter(foundItems, foundItemPhotos));
  app.use(createReceivedItemsRouter(welfare));
  app.use(createLostReportsRouter(lostReports, () => foundItems.getCatalogs(), foundItemPhotos));
  app.use(createCatalogRouter(catalog));

  return app;
}