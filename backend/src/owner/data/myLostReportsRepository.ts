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

/** How saving the changes of a report ended: saved, not the owner's report, or already recovered or closed. */
export type UpdateResult = 'UPDATED' | 'NOT_FOUND' | 'ALREADY_FINISHED';

/** How closing a report ended: closed, not the owner's report, or already recovered or closed. */
export type CloseResult = 'CLOSED' | 'NOT_FOUND' | 'ALREADY_FINISHED';

export type MyLostReportsRepository = {
  listMine: (ownerId: string) => Promise<MyLostReport[]>;
  findMine: (ownerId: string, code: string) => Promise<MyLostReport | null>;
  /** Null when the report does not exist or belongs to someone else. */
  findEditable: (ownerId: string, code: string) => Promise<EditableLostReport | null>;
  /** Saves the changes of the owner's report, only while it is still active. */
  updateMine: (ownerId: string, code: string, changes: ValidLostReport) => Promise<UpdateResult>;
  /** "Ya lo encontré": closes the owner's report and frees the item it was going to pick up. */
  closeMine: (ownerId: string, code: string) => Promise<CloseResult>;
};