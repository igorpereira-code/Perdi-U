import type { FoundItemStatus } from '@shared/statuses';
import type { WelfarePendingPickupView } from '@shared/welfare';

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

/** Objects Bienestar can inspect and receive. Tests use an in-memory implementation. */
export type WelfareRepository = {
  listPendingPickups: () => Promise<WelfarePendingPickupView[]>;
  listPending: () => Promise<WelfareFoundItem[]>;
  listInOffice: () => Promise<WelfareFoundItem[]>;
  findByCode: (code: string) => Promise<WelfareFoundItem | null>;
  receivePending: (itemId: string, receivedById: string, receivedAt: Date) => Promise<boolean>;
  deliver: (delivery: DeliveryRegistration) => Promise<DeliveryResult>;
};
