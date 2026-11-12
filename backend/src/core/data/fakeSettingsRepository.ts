import { WELFARE_OFFICE } from '@shared/constants';
import { DEFAULT_MIN_SIMILARITY } from '@shared/settings';
import type { SettingsRepository } from './settingsRepository';

/** In-memory settings for tests. It never touches the shared database. */
export function fakeSettingsRepository(): SettingsRepository {
  let welfareOffice = { ...WELFARE_OFFICE };
  let matchSettings = { minSimilarity: DEFAULT_MIN_SIMILARITY };

  return {
    getWelfareOffice: async () => welfareOffice,
    updateWelfareOffice: async (newWelfareOffice) => {
      welfareOffice = { ...newWelfareOffice };
      return welfareOffice;
    },
    getMatchSettings: async () => matchSettings,
    updateMatchSettings: async (newMatchSettings) => {
      matchSettings = { ...newMatchSettings };
      return matchSettings;
    },
  };
}
