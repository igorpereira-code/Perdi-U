import type { FoundItemStatus } from './statuses';

export type WelfareFoundItemView = {
  code: string;
  description: string;
  photoUrl: string | null;
  category: string;
  place: string;
  classroom: string | null;
  placeReference: string | null;
  foundAt: string;
  status: FoundItemStatus;
  finder: { name: string; email: string } | null;
};
