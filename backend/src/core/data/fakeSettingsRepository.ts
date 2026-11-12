import { WELFARE_OFFICE } from '@shared/constants';
import type { SettingsRepository } from './settingsRepository';

/** In-memory settings for tests. It never touches the shared database. */
export function fakeSettingsRepository(): SettingsRepository {
  let welfareOffice = { ...WELFARE_OFFICE };

  return {
    getWelfareOffice: async () => welfareOffice,
    updateWelfareOffice: async (newWelfareOffice) => {
      welfareOffice = { ...newWelfareOffice };
      return welfareOffice;
    },
  };
}
