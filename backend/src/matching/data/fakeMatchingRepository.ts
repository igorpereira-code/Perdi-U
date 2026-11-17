import type { MatchView } from '@shared/matching';
import type { LostReportToMatch, MatchingRepository, PublishedItem } from './matchingRepository';
import type { FoundItemStatus, LostReportStatus } from '@shared/statuses';

/** status is PUBLISHED when not given. */
export type FakeItem = PublishedItem & {
  code: string;
  photoUrl: string | null;
  category: string;
  status?: FoundItemStatus;
  visibility?: 'VISIBLE' | 'HIDDEN';
  publishedById?: string;
};

export type FakeReport = LostReportToMatch & { ownerId: string; status?: LostReportStatus };

/** In-memory matching repository for tests. It never touches the shared database. */
export function fakeMatchingRepository(initialReports: FakeReport[], initialItems: FakeItem[]) {
  // A copy, so a test that claims an item does not change the reports of the next test.
  const reports = initialReports.map((report) => ({ ...report }));
  // A copy, so a test that publishes an item does not change the items of the next test.
  const items = initialItems.map((item) => ({ ...item }));
  const matches: (MatchView & { lostReportId: string })[] = [];

  const repository: MatchingRepository = {
    findOwnLostReport: async (code, ownerId) =>
      reports.find((report) => report.code === code && report.ownerId === ownerId) ?? null,

    findLostReportByCode: async (code) =>
      reports.find((report) => report.code === code && report.status !== 'RECOVERED') ?? null,

    listPublishedItems: async () => items.filter((item) => statusOf(item) === 'PUBLISHED'),

    saveSuggestions: async (lostReportId, suggestions) => {
      for (const { foundItemId, similarity } of suggestions) {
        const exists = matches.some(
          (m) => m.lostReportId === lostReportId && m.foundItem.code === itemById(foundItemId).code,
        );
        if (!exists) {
          const { code, description, photoUrl, category, visibility } = itemById(foundItemId);
          matches.push({
            id: `match-${matches.length + 1}`,
            lostReportId,
            status: 'SUGGESTED',
            similarity,
            foundItem: { code, description, photoUrl, category },
            isHidden: visibility === 'HIDDEN',
          });
        }
      }
    },

    listMatches: async (lostReportId) =>
      matches.filter((m) => m.lostReportId === lostReportId && m.status !== 'DISMISSED'),

    findOwnMatch: async (matchId, ownerId) => {
      const match = matches.find((m) => m.id === matchId);
      const report = reports.find((r) => r.id === match?.lostReportId);
      return match && report?.ownerId === ownerId
        ? { id: match.id, lostReportId: match.lostReportId }
        : null;
    },

    markWillPickUp: async (matchId) => {
      setMatchStatus(matchId, 'WILL_PICK_UP');
    },

    claimItem: async (lostReportId, foundItemId, similarity) => {
      const report = reports.find((r) => r.id === lostReportId);
      if (!report || report.status === 'RECOVERED') {
        return 'REPORT_RECOVERED';
      }
      const { code, description, photoUrl, category } = itemById(foundItemId);
      const existing = matches.find((m) => m.lostReportId === lostReportId && m.foundItem.code === code);
      if (existing) {
        existing.status = 'WILL_PICK_UP';
      } else {
        matches.push({
          id: `match-${matches.length + 1}`,
          lostReportId,
          status: 'WILL_PICK_UP',
          similarity,
          foundItem: { code, description, photoUrl, category },
        });
      }
      report.status = 'PENDING_PICKUP';
      return 'CLAIMED';
    },

    dismiss: async (matchId) => {
      setMatchStatus(matchId, 'DISMISSED');
    },

    findFoundItemByCode: async (code) => {
      const item = items.find((i) => i.code === code);
      return item ? { ...item, status: statusOf(item) } : null;
    },

    publish: async (itemId, publishedById) => {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        item.status = 'PUBLISHED';
        item.publishedById = publishedById;
      }
    },

    listActiveLostReports: async () =>
      reports.filter((report) =>
        ['SEARCHING', 'HAS_MATCHES'].includes(report.status ?? 'SEARCHING'),
      ),
  };

  function setMatchStatus(matchId: string, status: MatchView['status']) {
    const match = matches.find((m) => m.id === matchId);
    if (match) {
      match.status = status;
    }
  }
  function itemById(id: string): FakeItem {
    const item = items.find((i) => i.id === id);
    if (!item) {
      throw new Error(`Unknown item ${id}`);
    }
    return item;
  }

  function statusOf(item: FakeItem): FoundItemStatus {
    return item.status ?? 'PUBLISHED';
  }

  return { repository, matches, items, reports };
}