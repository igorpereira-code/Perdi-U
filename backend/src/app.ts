import express from 'express';
import cors from 'cors';
import { APP_NAME } from '@shared/constants';
import { createUserAuthenticator, getCurrentUser, type VerifyToken } from './core/currentUser';
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
import type { MyLostReportsRepository } from './owner/data/myLostReportsRepository';
import { prismaMyLostReportsRepository } from './owner/data/prismaMyLostReportsRepository';
import { createMyLostReportsRouter } from './owner/routes/myLostReportsRouter';
import type { NotificationsRepository } from './core/data/notificationsRepository';
import { prismaNotificationsRepository } from './core/data/prismaNotificationsRepository';
import { createNotificationsRouter } from './core/routes/notificationsRouter';
import type { AdminUsersRepository } from './admin/data/adminUsersRepository';
import { prismaAdminUsersRepository } from './admin/data/prismaAdminUsersRepository';
import { createAdminUsersRouter } from './admin/routes/adminUsersRouter';
import type { AdminCatalogRepository } from './admin/data/adminCatalogRepository';
import { prismaAdminCatalogRepository } from './admin/data/prismaAdminCatalogRepository';
import { createAdminCatalogRouter } from './admin/routes/adminCatalogRouter';
import type { SettingsRepository } from './core/data/settingsRepository';
import { prismaSettingsRepository } from './core/data/prismaSettingsRepository';
import { createSettingsRouter } from './core/routes/settingsRouter';

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
  myLostReports?: MyLostReportsRepository;
  notifications?: NotificationsRepository;
  adminUsers?: AdminUsersRepository;
  adminCatalog?: AdminCatalogRepository;
  settings?: SettingsRepository;
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
  myLostReports = prismaMyLostReportsRepository,
  notifications = prismaNotificationsRepository,
  adminUsers = prismaAdminUsersRepository,
  adminCatalog = prismaAdminCatalogRepository,
  settings = prismaSettingsRepository,
}: AppOptions = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', app: APP_NAME });
  });

  app.use(createUserAuthenticator({ verifyToken, users, allowSampleUsers }));

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
  app.use(createMyLostReportsRouter(myLostReports));
  app.use(createNotificationsRouter(notifications));
  app.use(createAdminUsersRouter(adminUsers));
  app.use(createAdminCatalogRouter(adminCatalog));
  app.use(createSettingsRouter(settings));
  return app;
}
