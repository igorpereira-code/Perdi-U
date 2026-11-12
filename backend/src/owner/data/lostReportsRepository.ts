import type { ValidLostReport } from '../logic/validateLostReport';

export type NewLostReport = ValidLostReport & {
  ownerId: string;
  photoUrl?: string;
};

export type CreatedLostReport = {
  code: string;
  status: string;
};

export type LostReportsRepository = {
  create: (report: NewLostReport) => Promise<CreatedLostReport>;
};