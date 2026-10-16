import type { MatchView } from '@shared/matching';
import type { FoundItemForMatching, LostReportForMatching } from '../logic/similarity';

export type LostReportToMatch = LostReportForMatching & { id: string; code: string };
export type PublishedItem = FoundItemForMatching & { id: string };
export type Suggestion = { foundItemId: string; similarity: number };

/** Where lost reports, published items and matches are read and saved. Tests use a fake one. */
export type MatchingRepository = {
  /** The lost report with that code, only if it belongs to that user. */
  findOwnLostReport: (code: string, ownerId: string) => Promise<LostReportToMatch | null>;
  listPublishedItems: () => Promise<PublishedItem[]>;
  /** Saves new suggestions. The ones that already exist (even if dismissed) are left as they are. */
  saveSuggestions: (lostReportId: string, suggestions: Suggestion[]) => Promise<void>;
  /** The matches of a report that the owner did not dismiss. */
  listMatches: (lostReportId: string) => Promise<MatchView[]>;
};
