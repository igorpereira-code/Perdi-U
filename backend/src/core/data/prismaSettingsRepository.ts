import { WELFARE_OFFICE } from '@shared/constants';
import { DEFAULT_MIN_SIMILARITY } from '@shared/settings';
import { db } from './prisma';
import type { SettingsRepository } from './settingsRepository';

/** The settings live in a single row. */
const SETTINGS_ID = 1;
const WELFARE_OFFICE_FIELDS = { welfarePlace: true, welfareHours: true } as const;
const MATCH_SETTINGS_FIELDS = { minSimilarity: true } as const;

/** Needed only if the settings row was never created. */
const WELFARE_OFFICE_DEFAULTS = {
  welfarePlace: WELFARE_OFFICE.place,
  welfareHours: WELFARE_OFFICE.hours,
};

type SavedWelfareOffice = { welfarePlace: string; welfareHours: string };

function toWelfareOffice({ welfarePlace, welfareHours }: SavedWelfareOffice) {
  return { place: welfarePlace, hours: welfareHours };
}

export const prismaSettingsRepository: SettingsRepository = {
  getWelfareOffice: async () => {
    const settings = await db().appSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: WELFARE_OFFICE_FIELDS,
    });
    return settings ? toWelfareOffice(settings) : WELFARE_OFFICE;
  },
  updateWelfareOffice: async ({ place, hours }) => {
    const welfareOffice = { welfarePlace: place, welfareHours: hours };
    const settings = await db().appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: welfareOffice,
      create: { id: SETTINGS_ID, ...welfareOffice },
      select: WELFARE_OFFICE_FIELDS,
    });
    return toWelfareOffice(settings);
  },
  getMatchSettings: async () => {
    const settings = await db().appSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: MATCH_SETTINGS_FIELDS,
    });
    return settings ?? { minSimilarity: DEFAULT_MIN_SIMILARITY };
  },
  updateMatchSettings: ({ minSimilarity }) =>
    db().appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: { minSimilarity },
      create: { id: SETTINGS_ID, ...WELFARE_OFFICE_DEFAULTS, minSimilarity },
      select: MATCH_SETTINGS_FIELDS,
    }),
};
