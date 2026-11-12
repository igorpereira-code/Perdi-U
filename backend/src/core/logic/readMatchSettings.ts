import type { MatchSettings } from '@shared/settings';

export type MatchSettingsResult = { matchSettings: MatchSettings } | { error: string };

/** A whole number from 0 to 100. */
function isSimilarityLevel(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100;
}

/** Reads the minimum similarity sent by the Administrator. */
export function readMatchSettings(body: unknown): MatchSettingsResult {
  const { minSimilarity } = (body ?? {}) as { minSimilarity?: unknown };
  return isSimilarityLevel(minSimilarity)
    ? { matchSettings: { minSimilarity } }
    : { error: 'El nivel mínimo debe ser un número entero entre 0 y 100.' };
}
