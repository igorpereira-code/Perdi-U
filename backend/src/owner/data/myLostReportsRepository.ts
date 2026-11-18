import type { LostReportStatus } from '@shared/statuses';
import type { ValidLostReport } from '../logic/validateLostReport';

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

/** A lost report as the edit form fills it: ids instead of names, the same data it is saved with. */
export type EditableLostReport = ValidLostReport;

export type MyLostReportsRepository = {
  listMine: (ownerId: string) => Promise<MyLostReport[]>;
  findMine: (ownerId: string, code: string) => Promise<MyLostReport | null>;
  /** Null when the report does not exist or belongs to someone else. */
  findEditable: (ownerId: string, code: string) => Promise<EditableLostReport | null>;
  /** Saves the changes of the owner's report. False when it does not exist or belongs to someone else. */
  updateMine: (ownerId: string, code: string, changes: ValidLostReport) => Promise<boolean>;
};