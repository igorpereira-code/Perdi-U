import type { AppUser } from '@shared/user';

export type UserProfile = AppUser & {
  photoUrl: string | null;
};

/** Where user profiles are saved. The real one uses the database; tests use a fake one. */
export type UsersRepository = {
  findById: (id: string) => Promise<UserProfile | null>;
  create: (profile: Omit<UserProfile, 'hasSeenGuide'>) => Promise<UserProfile>;
  markGuideSeen: (id: string) => Promise<void>;
  listWelfareEmails: () => Promise<string[]>;
};
