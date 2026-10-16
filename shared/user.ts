export type Role = 'COMMUNITY' | 'WELFARE' | 'ADMIN';

/** The signed-in user, as the API returns it in GET /me. */
export type AppUser = {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  role: Role;
};
