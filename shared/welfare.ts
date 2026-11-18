import type { FoundItemStatus, LostReportStatus } from './statuses';

export type WelfareFoundItemView = {
  code: string;
  description: string;
  photoUrl: string | null;
  category: string;
  categoryId: number;
  place: string;
  placeId: number;
  classroom: string | null;
  classroomId: number | null;
  placeReference: string | null;
  foundAt: string;
  status: FoundItemStatus;
  visibility: 'VISIBLE' | 'HIDDEN';
  finder: { name: string; email: string } | null;
};

export type WelfarePendingPickupView = {
  matchId: string;
  owner: { name: string; email: string };
  report: { code: string };
  foundItem: { code: string; description: string };
};

export type WelfareDeliveryView = {
  foundItem: { code: string; description: string };
  recipient: { name: string; email: string; universityCode: string };
  deliveredAt: string;
};

export type WelfareLostReportView = {
  code: string;
  description: string;
  photoUrl: string | null;
  category: string;
  dateFrom: string;
  dateTo: string;
  status: LostReportStatus;
  owner: { name: string; email: string };
};
