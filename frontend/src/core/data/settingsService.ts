import type { WelfareOffice } from '@shared/settings';
import type { ApiFetch } from './api';

export type SettingsService = {
  getWelfareOffice: () => Promise<WelfareOffice>;
  /** Saves the new place and hours (only the Administrator) and returns them. */
  updateWelfareOffice: (welfareOffice: WelfareOffice) => Promise<WelfareOffice>;
};

const LOAD_WELFARE_OFFICE_ERROR =
  'No se pudo cargar la ubicación de Bienestar. Intenta nuevamente.';
const SAVE_WELFARE_OFFICE_ERROR =
  'No se pudo guardar la ubicación de Bienestar. Intenta nuevamente.';

export function createSettingsService(apiFetch: ApiFetch): SettingsService {
  return {
    getWelfareOffice: async () => {
      const response = await apiFetch('/welfare-office');
      if (!response.ok) {
        throw new Error(LOAD_WELFARE_OFFICE_ERROR);
      }
      return response.json();
    },
    updateWelfareOffice: async (welfareOffice) => {
      const response = await apiFetch('/admin/welfare-office', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(welfareOffice),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof body?.error === 'string' ? body.error : SAVE_WELFARE_OFFICE_ERROR);
      }
      return body;
    },
  };
}
