import type { WelfareOffice } from '@shared/settings';

export const MAX_WELFARE_TEXT_LENGTH = 120;

export type WelfareOfficeResult = { welfareOffice: WelfareOffice } | { error: string };

/** "  Bloque   C " → "Bloque C". Anything that is not text becomes "". */
function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

type TextMessages = { missing: string; tooLong: string };

const PLACE_MESSAGES: TextMessages = {
  missing: 'Escribe la ubicación.',
  tooLong: `La ubicación puede tener hasta ${MAX_WELFARE_TEXT_LENGTH} caracteres.`,
};
const HOURS_MESSAGES: TextMessages = {
  missing: 'Escribe el horario.',
  tooLong: `El horario puede tener hasta ${MAX_WELFARE_TEXT_LENGTH} caracteres.`,
};

/** Why the text cannot be saved, or null if it is fine. */
function validateText(text: string, messages: TextMessages): string | null {
  if (text === '') {
    return messages.missing;
  }
  if (text.length > MAX_WELFARE_TEXT_LENGTH) {
    return messages.tooLong;
  }
  return null;
}

/** Reads the place and hours of Bienestar sent by the Administrator. */
export function readWelfareOffice(body: unknown): WelfareOfficeResult {
  const { place, hours } = (body ?? {}) as { place?: unknown; hours?: unknown };
  const welfareOffice = { place: cleanText(place), hours: cleanText(hours) };
  const error =
    validateText(welfareOffice.place, PLACE_MESSAGES) ??
    validateText(welfareOffice.hours, HOURS_MESSAGES);
  return error ? { error } : { welfareOffice };
}
