import type { MatchView } from '@shared/matching';
import type { FoundItemForMatching, LostReportForMatching } from '../logic/similarity';
import type { FoundItemStatus } from '@shared/statuses';

export type LostReportToMatch = LostReportForMatching & { id: string; code: string };
export type PublishedItem = FoundItemForMatching & { id: string };
export type Suggestion = { foundItemId: string; similarity: number };
export type FoundItemToPublish = PublishedItem & { code: string; status: FoundItemStatus };

/** Where lost reports, published items and matches are read and saved. Tests use a fake one. */
export type MatchingRepository = {
  /** The lost report with that code, only if it belongs to that user. */
  findOwnLostReport: (code: string, ownerId: string) => Promise<LostReportToMatch | null>;
  listPublishedItems: () => Promise<PublishedItem[]>;
  /** Saves new suggestions. The ones that already exist (even if dismissed) are left as they are. */
  saveSuggestions: (lostReportId: string, suggestions: Suggestion[]) => Promise<void>;
  /** The matches of a report that the owner did not dismiss. */
  listMatches: (lostReportId: string) => Promise<MatchView[]>;
  /** The match, only if its lost report belongs to that user. */
  findOwnMatch: (
    matchId: string,
    ownerId: string,
  ) => Promise<{ id: string; lostReportId: string } | null>;
  /** The owner will pick the item up: Bienestar sees it in pending pickups. */
  markWillPickUp: (matchId: string) => Promise<void>;

  /** "No es mío": the item stops showing up for that report, even when matching runs again. */
  dismiss: (matchId: string) => Promise<void>;

  findFoundItemByCode: (code: string) => Promise<FoundItemToPublish | null>;
  /** The item becomes visible to the community. */
  publish: (itemId: string, publishedById: string) => Promise<void>;
  /** Lost reports whose owners are still looking: "Buscando" or "Con coincidencias". */
  listActiveLostReports: () => Promise<LostReportToMatch[]>;
};
