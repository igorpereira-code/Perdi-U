import type { MatchStatus } from './statuses';

/** A found item that looks like the user's lost item, as GET /lost-reports/:code/matches returns it. */
export type MatchView = {
  id: string;
  status: MatchStatus;
  similarity: number;
  foundItem: {
    code: string;
    description: string;
    photoUrl: string | null;
    category: string;
  };
};

/** What Bienestar gets after trying to publish a found item. */
export type PublishResult =
  | { status: 'PUBLISHED'; matchCount: number }
  | { status: 'NOT_RECEIVED' };
