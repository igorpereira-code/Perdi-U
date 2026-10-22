import type { LostReportStatus } from '@shared/statuses';

/** A lost report as its owner sees it. */
export type MyLostReport = {
  code: string;
  description: string;
  category: string;
  status: LostReportStatus;
  places: string[];
  placeDescription: string | null;
  dateFrom: Date;
  dateTo: Date;
};

export type MyLostReportsRepository = {
  listMine: (ownerId: string) => Promise<MyLostReport[]>;
  findMine: (ownerId: string, code: string) => Promise<MyLostReport | null>;
};