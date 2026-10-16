import type { Role } from '@shared/user';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
  role: Role;
};

/** Where user profiles are saved. The real one uses the database; tests use a fake one. */
export type UsersRepository = {
  findById: (id: string) => Promise<UserProfile | null>;
  create: (profile: UserProfile) => Promise<UserProfile>;
  listWelfareEmails: () => Promise<string[]>;
};
