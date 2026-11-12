import type { MatchSettings, WelfareOffice } from '@shared/settings';
import type { ApiFetch } from './api';

export type SettingsService = {
  getWelfareOffice: () => Promise<WelfareOffice>;
  /** Saves the new place and hours (only the Administrator) and returns them. */
  updateWelfareOffice: (welfareOffice: WelfareOffice) => Promise<WelfareOffice>;
  /** Only the Administrator can read it. */
  getMatchSettings: () => Promise<MatchSettings>;
  /** Saves the new minimum similarity (only the Administrator) and returns it. */
  updateMatchSettings: (matchSettings: MatchSettings) => Promise<MatchSettings>;
};

const LOAD_WELFARE_OFFICE_ERROR =
  'No se pudo cargar la ubicación de Bienestar. Intenta nuevamente.';
const SAVE_WELFARE_OFFICE_ERROR =
  'No se pudo guardar la ubicación de Bienestar. Intenta nuevamente.';
const LOAD_MATCH_SETTINGS_ERROR = 'No se pudo cargar el nivel mínimo. Intenta nuevamente.';
const SAVE_MATCH_SETTINGS_ERROR = 'No se pudo guardar el nivel mínimo. Intenta nuevamente.';

export function createSettingsService(apiFetch: ApiFetch): SettingsService {
  async function getJson<T>(path: string, errorMessage: string): Promise<T> {
    const response = await apiFetch(path);
    if (!response.ok) {
      throw new Error(errorMessage);
    }
    return response.json();
  }

  /** Saves with PUT and returns what was saved, or throws the backend's message. */
  async function putJson<T>(path: string, data: T, fallbackError: string): Promise<T> {
    const response = await apiFetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(typeof body?.error === 'string' ? body.error : fallbackError);
    }
    return body;
  }

  return {
    getWelfareOffice: () => getJson('/welfare-office', LOAD_WELFARE_OFFICE_ERROR),
    updateWelfareOffice: (welfareOffice) =>
      putJson('/admin/welfare-office', welfareOffice, SAVE_WELFARE_OFFICE_ERROR),
    getMatchSettings: () => getJson('/admin/match-settings', LOAD_MATCH_SETTINGS_ERROR),
    updateMatchSettings: (matchSettings) =>
      putJson('/admin/match-settings', matchSettings, SAVE_MATCH_SETTINGS_ERROR),
  };
}
