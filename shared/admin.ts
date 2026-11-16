import type { Role } from './user';

/** A user as the Administrator sees it in GET /admin/users. */
export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};
