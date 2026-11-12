import type { ApiFetch } from '../../core/data/api';

export type GuideService = {
  markSeen: () => Promise<void>;
};

export const GUIDE_SAVE_ERROR = 'No pudimos guardar tu decisión. Inténtalo de nuevo.';

export function createGuideService(apiFetch: ApiFetch): GuideService {
  return {
    markSeen: async () => {
      const response = await apiFetch('/me/guide-seen', { method: 'POST' });
      if (!response.ok) {
        throw new Error(GUIDE_SAVE_ERROR);
      }
    },
  };
}
