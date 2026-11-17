import type { WelfareFoundItemView } from '@shared/welfare';
import type { ReceptionCorrection } from '../data/welfareService';

export type WelfareSection =
  | 'reports'
  | 'requests'
  | 'register'
  | 'custody'
  | 'pickups'
  | 'delivery'
  | 'deliveries';

export type ReceptionDraft = Omit<ReceptionCorrection, 'foundAt'> & { foundAt: string };

export function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateTimeLocal(value: string): string {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function buildReceptionDraft(item: WelfareFoundItemView): ReceptionDraft {
  return {
    description: item.description,
    categoryId: item.categoryId,
    placeId: item.placeId,
    classroomId: item.classroomId,
    placeReference: item.placeReference,
    foundAt: formatDateTimeLocal(item.foundAt),
  };
}
