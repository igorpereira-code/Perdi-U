import type { MatchView } from '@shared/matching';
import type { LostReportToMatch, MatchingRepository, PublishedItem } from './matchingRepository';

export type FakeItem = PublishedItem & { code: string; photoUrl: string | null; category: string };
export type FakeReport = LostReportToMatch & { ownerId: string };

/** In-memory matching repository for tests. It never touches the shared database. */
export function fakeMatchingRepository(reports: FakeReport[], items: FakeItem[]) {
  const matches: (MatchView & { lostReportId: string })[] = [];

  const repository: MatchingRepository = {
    findOwnLostReport: async (code, ownerId) =>
      reports.find((report) => report.code === code && report.ownerId === ownerId) ?? null,

    listPublishedItems: async () => items,

    saveSuggestions: async (lostReportId, suggestions) => {
      for (const { foundItemId, similarity } of suggestions) {
        const exists = matches.some(
          (m) => m.lostReportId === lostReportId && m.foundItem.code === itemById(foundItemId).code,
        );
        if (!exists) {
          const { code, description, photoUrl, category } = itemById(foundItemId);
          matches.push({
            id: `match-${matches.length + 1}`,
            lostReportId,
            status: 'SUGGESTED',
            similarity,
            foundItem: { code, description, photoUrl, category },
          });
        }
      }
    },

    listMatches: async (lostReportId) =>
      matches.filter((m) => m.lostReportId === lostReportId && m.status !== 'DISMISSED'),
  };

  function itemById(id: string): FakeItem {
    const item = items.find((i) => i.id === id);
    if (!item) {
      throw new Error(`Unknown item ${id}`);
    }
    return item;
  }

  return { repository, matches };
}
