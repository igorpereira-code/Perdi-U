import type { FoundItemStatus, LostReportStatus } from './statuses';

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

export type WelfarePendingPickupView = {
  matchId: string;
  owner: { name: string; email: string };
  report: { code: string };
  foundItem: { code: string; description: string };
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
