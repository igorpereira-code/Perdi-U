import type { MatchView } from '@shared/matching';
import type { ApiFetch } from '../../core/data/api';

export type MatchesService = {
  getMatches: (reportCode: string) => Promise<MatchView[]>;
};

export function createMatchesService(apiFetch: ApiFetch): MatchesService {
  return {
    getMatches: async (reportCode) => {
      const response = await apiFetch(`/lost-reports/${reportCode}/matches`);
      return response.json();
    },
  };
}
