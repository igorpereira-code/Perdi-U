import type { MatchView, PublishResult } from '@shared/matching';
import type { ApiFetch } from '../../core/data/api';

export type MatchesService = {
  /** null when the report does not exist or belongs to someone else. */
  getMatches: (reportCode: string) => Promise<MatchView[] | null>;
  pickUp: (matchId: string) => Promise<void>;
  dismiss: (matchId: string) => Promise<void>;
  /** Bienestar publishes a found item so the community can see it. */
  publish: (itemCode: string) => Promise<PublishResult>;
};

export function createMatchesService(apiFetch: ApiFetch): MatchesService {
  return {
    getMatches: async (reportCode) => {
      const response = await apiFetch(`/lost-reports/${reportCode}/matches`);
      if (!response.ok) {
        return null;
      }
      return response.json();
    },
    pickUp: async (matchId) => {
      await apiFetch(`/matches/${matchId}/pick-up`, { method: 'POST' });
    },
    dismiss: async (matchId) => {
      await apiFetch(`/matches/${matchId}/dismiss`, { method: 'POST' });
    },
    publish: async (itemCode) => {
      const response = await apiFetch(`/found-items/${itemCode}/publish`, { method: 'POST' });
      if (response.status === 409) {
        return { status: 'NOT_RECEIVED' };
      }
      return { status: 'PUBLISHED', matchCount: 0 };
    },
  };
}
