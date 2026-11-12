import { WELFARE_OFFICE } from '@shared/constants';
import { db } from './prisma';
import type { SettingsRepository } from './settingsRepository';

/** The settings live in a single row. */
const SETTINGS_ID = 1;
const WELFARE_OFFICE_FIELDS = { welfarePlace: true, welfareHours: true } as const;

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
};
