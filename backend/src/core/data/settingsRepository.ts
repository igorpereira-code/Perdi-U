import type { WelfareOffice } from '@shared/settings';

/** Where the app settings are saved. Tests use a fake one. */
export type SettingsRepository = {
  getWelfareOffice: () => Promise<WelfareOffice>;
  /** Saves the new place and hours and returns them. */
  updateWelfareOffice: (welfareOffice: WelfareOffice) => Promise<WelfareOffice>;
};
