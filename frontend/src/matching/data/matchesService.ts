import type { MatchView, PublishResult } from '@shared/matching';
import type { ApiFetch } from '../../core/data/api';

export type MatchesService = {
  /** null when the report does not exist or belongs to someone else. */
  getMatches: (reportCode: string) => Promise<MatchView[] | null>;
  pickUp: (matchId: string) => Promise<void>;
  dismiss: (matchId: string) => Promise<void>;
  /** Bienestar publishes a found item with its chosen community visibility. */
  publish: (itemCode: string, visibility?: 'VISIBLE' | 'HIDDEN') => Promise<PublishResult>;
};

const REPORT_NOT_FOUND_STATUSES = [403, 404];

export function createMatchesService(apiFetch: ApiFetch): MatchesService {
  /** Saves the owner's answer to a match: "pick-up" or "dismiss". */
  async function sendMatchAnswer(matchId: string, answer: 'pick-up' | 'dismiss') {
    const response = await apiFetch(`/matches/${matchId}/${answer}`, { method: 'POST' });
    if (!response.ok) {
      throw new Error('No se pudo guardar tu respuesta. Intenta nuevamente.');
    }
  }

  return {
    getMatches: async (reportCode) => {
      const response = await apiFetch(`/lost-reports/${reportCode}/matches`);
      if (REPORT_NOT_FOUND_STATUSES.includes(response.status)) {
        return null;
      }
      if (!response.ok) {
        throw new Error('No se pudieron cargar los objetos parecidos. Intenta nuevamente.');
      }
      return response.json();
    },
    pickUp: (matchId) => sendMatchAnswer(matchId, 'pick-up'),
    dismiss: (matchId) => sendMatchAnswer(matchId, 'dismiss'),
    publish: async (itemCode, visibility = 'VISIBLE') => {
      const response = await apiFetch(
        `/found-items/${itemCode}/publish`,
        visibility === 'VISIBLE'
          ? { method: 'POST' }
          : {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ visibility }),
            },
      );
      if (response.status === 409) {
        return { status: 'NOT_RECEIVED' };
      }
      if (!response.ok) {
        throw new Error('No se pudo publicar. Intenta nuevamente.');
      }
      const result = await response.json();
      return {
        status: 'PUBLISHED',
        matchCount: result.matchCount,
        visibility: result.visibility ?? visibility,
      };
    },
  };
}
