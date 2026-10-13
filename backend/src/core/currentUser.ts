import type { Request, RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { SAMPLE_USERS } from './sampleUsers';

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: CurrentUser;
    }
  }
}

type SampleUserKey = keyof typeof SAMPLE_USERS;
const DEFAULT_SAMPLE_USER: SampleUserKey = 'ana';

const isSampleUserKey = (key: string): key is SampleUserKey => Object.hasOwn(SAMPLE_USERS, key);

/**
 * TEMPORARY: until Google login is ready, every request acts as a sample user.
 * Send the header `x-sample-user: ana | luis | welfare` to switch users.
 * When login is ready, only this function changes; routes keep using getCurrentUser().
 */
export const currentUser: RequestHandler = (req, res, next) => {
  const key = req.header('x-sample-user') ?? DEFAULT_SAMPLE_USER;

  if (!isSampleUserKey(key)) {
    res.status(400).json({ error: `Unknown sample user: ${key}` });
    return;
  }

  req.user = SAMPLE_USERS[key];
  next();
};

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
