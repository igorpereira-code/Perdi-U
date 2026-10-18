import type { FoundItemStatus } from '@shared/statuses';

export type WelfareFoundItem = {
  id: string;
  code: string;
  description: string;
  photoUrl: string | null;
  category: string;
  place: string;
  classroom: string | null;
  placeReference: string | null;
  foundAt: Date;
  status: FoundItemStatus;
  finder: { name: string; email: string } | null;
};

/** Objects Bienestar can inspect and receive. Tests use an in-memory implementation. */
export type WelfareRepository = {
  listPending: () => Promise<WelfareFoundItem[]>;
  findByCode: (code: string) => Promise<WelfareFoundItem | null>;
};
