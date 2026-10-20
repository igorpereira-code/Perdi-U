import type { Request, RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import type { AppUser } from '@shared/user';
import { verifySupabaseToken } from './data/supabaseAuth';
import { SAMPLE_USERS } from './sampleUsers';
import { isInstitutionalEmail } from './logic/institutionalEmail';
import { prismaUsersRepository } from './data/prismaUsersRepository';
import type { UsersRepository } from './data/usersRepository';
import { roleForEmail } from './logic/roleForEmail';

export type CurrentUser = AppUser;

declare global {
  namespace Express {
    interface Request {
      user?: CurrentUser;
    }
  }
}

export type TokenUser = {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
};

/** Checks a login token and returns who it belongs to, or null if it is not valid. */
export type VerifyToken = (token: string) => Promise<TokenUser | null>;

type SampleUserKey = keyof typeof SAMPLE_USERS;
const DEFAULT_SAMPLE_USER: SampleUserKey = 'ana';

const isSampleUserKey = (key: string): key is SampleUserKey => Object.hasOwn(SAMPLE_USERS, key);

/** TEMPORARY sample users, so the team can try the API without signing in with Google. */
const useSampleUser: RequestHandler = (req, res, next) => {
  const key = req.header('x-sample-user') ?? DEFAULT_SAMPLE_USER;

  if (!isSampleUserKey(key)) {
    res.status(400).json({ error: `Unknown sample user: ${key}` });
    return;
  }

  req.user = SAMPLE_USERS[key];
  next();
};

/**
 * Returns the user's saved profile.
 * On the first sign-in it does not exist yet, so it is created with the data from Google. No form needed.
 */
async function findOrCreateProfile(
  tokenUser: TokenUser,
  users: UsersRepository,
): Promise<CurrentUser> {
  const savedProfile = await users.findById(tokenUser.id);
  if (savedProfile) {
    return savedProfile;
  }

  const role = roleForEmail(tokenUser.email, await users.listWelfareEmails());
  return users.create({ ...tokenUser, photoUrl: tokenUser.photoUrl ?? null, role });
}

/**
 * Finds out who is making the request:
 * - With `Authorization: Bearer <token>`, it is the user who signed in with Google.
 * - Otherwise, a sample user (header `x-sample-user: ana | luis | welfare`),
 *   only if ALLOW_SAMPLE_USERS=true (local development). If not, the user must sign in.
 * Routes always use getCurrentUser(), so they never care which one it was.
 */
export function createCurrentUser(
  verifyToken: VerifyToken,
  users: UsersRepository,
  allowSampleUsers: boolean,
): RequestHandler {
  return async (req, res, next) => {
    const token = req.header('authorization')?.replace('Bearer ', '');
    if (!token) {
      if (!allowSampleUsers) {
        res.status(401).json({ error: 'Sign in to continue.' });
        return;
      }
      useSampleUser(req, res, next);
      return;
    }

    const tokenUser = await verifyToken(token);
    if (!tokenUser) {
      res.status(401).json({ error: 'Your session is not valid. Sign in again.' });
      return;
    }
    if (!isInstitutionalEmail(tokenUser.email)) {
      res.status(403).json({ code: 'NOT_INSTITUTIONAL_EMAIL' });
      return;
    }

    req.user = await findOrCreateProfile(tokenUser, users);
    next();
  };
}

export const currentUser = createCurrentUser(
  verifySupabaseToken,
  prismaUsersRepository,
  process.env.ALLOW_SAMPLE_USERS === 'true',
);

/** Returns the user making the request. Use it inside any route. */
export function getCurrentUser(req: Request): CurrentUser {
  if (!req.user) {
    throw new Error('The currentUser middleware must run before this route');
  }
  return req.user;
}

/** Only lets the request through if the user has one of the given roles. */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'You do not have permission to do this' });
      return;
    }
    next();
  };
