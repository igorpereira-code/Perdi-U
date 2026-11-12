import type { MatchSettings, WelfareOffice } from '@shared/settings';

/** Where the app settings are saved. Tests use a fake one. */
export type SettingsRepository = {
  getWelfareOffice: () => Promise<WelfareOffice>;
  /** Saves the new place and hours and returns them. */
  updateWelfareOffice: (welfareOffice: WelfareOffice) => Promise<WelfareOffice>;
  getMatchSettings: () => Promise<MatchSettings>;
  /** Saves the new minimum similarity and returns it. */
  updateMatchSettings: (matchSettings: MatchSettings) => Promise<MatchSettings>;
};
