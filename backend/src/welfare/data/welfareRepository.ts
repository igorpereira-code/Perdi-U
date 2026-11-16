import type { FoundItemStatus, LostReportStatus } from '@shared/statuses';
import type { WelfarePendingPickupView } from '@shared/welfare';

export type WelfareFoundItem = {
  id: string;
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
  foundAt: Date;
  status: FoundItemStatus;
  visibility: 'VISIBLE' | 'HIDDEN';
  finder: { name: string; email: string } | null;
  receivedById?: string;
  receivedAt?: Date;
};

export type DeliveryRegistration = {
  foundItemCode: string;
  lostReportCode: string | null;
  recipientName: string;
  recipientEmail: string;
  recipientUniversityCode: string;
  registeredById: string;
  deliveredAt: Date;
};

export type DeliveryResult =
  | { status: 'DELIVERED'; foundItemCode: string }
  | { status: 'ITEM_NOT_AVAILABLE' }
  | { status: 'REPORT_NOT_ELIGIBLE' };

export type ReceptionCorrection = {
  description: string;
  categoryId: number;
  placeId: number;
  classroomId: number | null;
  placeReference: string | null;
  foundAt: Date;
};

export type DirectFoundItemRegistration = ReceptionCorrection & {
  receivedById: string;
  receivedAt: Date;
  photoUrl?: string;
};

export type DirectFoundItemCreated = {
  code: string;
  status: 'IN_CUSTODY';
};

export type WelfareLostReport = {
  id: string;
  code: string;
  description: string;
  photoUrl: string | null;
  category: string;
  dateFrom: Date;
  dateTo: Date;
  status: LostReportStatus;
  owner: { name: string; email: string };
};

/** Objects Bienestar can inspect and receive. Tests use an in-memory implementation. */
export type WelfareRepository = {
  listActiveLostReports: () => Promise<WelfareLostReport[]>;
  findActiveLostReportByCode: (code: string) => Promise<WelfareLostReport | null>;
  listPendingPickups: () => Promise<WelfarePendingPickupView[]>;
  listPending: () => Promise<WelfareFoundItem[]>;
  listInOffice: () => Promise<WelfareFoundItem[]>;
  findFoundItemByCode: (code: string) => Promise<WelfareFoundItem | null>;
  registerFoundItem: (
    registration: DirectFoundItemRegistration,
  ) => Promise<DirectFoundItemCreated>;
  confirmPendingReception: (
    itemId: string,
    receivedById: string,
    receivedAt: Date,
    correction?: ReceptionCorrection,
  ) => Promise<WelfareFoundItem | null>;
  deletePending: (itemId: string) => Promise<boolean>;
  updatePublishedVisibility: (
    itemId: string,
    visibility: 'VISIBLE' | 'HIDDEN',
  ) => Promise<boolean>;
  deliver: (delivery: DeliveryRegistration) => Promise<DeliveryResult>;
};
