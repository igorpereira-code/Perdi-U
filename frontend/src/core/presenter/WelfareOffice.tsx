import { createContext, useContext, useEffect, useState } from 'react';
import { WELFARE_OFFICE } from '@shared/constants';
import type { WelfareOffice } from '@shared/settings';
import type { SettingsService } from '../data/settingsService';

/**
 * The place and hours of Bienestar for every WelfareCard of the app.
 * Until the saved ones arrive (or if they cannot be loaded), the usual ones are shown.
 */
export const WelfareOfficeContext = createContext<WelfareOffice>(WELFARE_OFFICE);

/** The place and hours of Bienestar that users must see. */
export function useWelfareOffice(): WelfareOffice {
  return useContext(WelfareOfficeContext);
}

/**
 * Loads the place and hours that the Administrator saved: when someone signs in,
 * and again every time the user comes back to the app.
 */
export function useSavedWelfareOffice(
  settingsService: SettingsService | undefined,
  signedInUserId: string | undefined,
): WelfareOffice {
  const [welfareOffice, setWelfareOffice] = useState<WelfareOffice>(WELFARE_OFFICE);

  useEffect(() => {
    let isActive = true;
    function loadWelfareOffice() {
      if (!settingsService || !signedInUserId) {
        return;
      }
      settingsService
        .getWelfareOffice()
        .then((savedWelfareOffice) => isActive && setWelfareOffice(savedWelfareOffice))
        .catch(() => undefined);
    }

    loadWelfareOffice();
    window.addEventListener('focus', loadWelfareOffice);
    return () => {
      isActive = false;
      window.removeEventListener('focus', loadWelfareOffice);
    };
  }, [settingsService, signedInUserId]);

  return welfareOffice;
}
