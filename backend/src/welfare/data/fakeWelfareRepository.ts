import type { WelfareFoundItem, WelfareRepository } from './welfareRepository';
import type { LostReportStatus, MatchStatus } from '@shared/statuses';
import type { WelfarePendingPickupView } from '@shared/welfare';

type FakePendingPickup = WelfarePendingPickupView & {
  matchStatus: MatchStatus;
  reportStatus: LostReportStatus;
};

/** In-memory welfare repository for tests. It never touches the shared database. */
export function fakeWelfareRepository(
  initialItems: WelfareFoundItem[],
  initialPickups: FakePendingPickup[] = [],
) {
  const items = initialItems.map((item) => ({ ...item, finder: item.finder && { ...item.finder } }));

  const repository: WelfareRepository = {
    listPendingPickups: async () =>
      initialPickups
        .filter(
          (pickup) =>
            pickup.matchStatus === 'WILL_PICK_UP' && pickup.reportStatus === 'PENDING_PICKUP',
        )
        .map(({ matchStatus: _matchStatus, reportStatus: _reportStatus, ...pickup }) => pickup),
    listPending: async () =>
      items
        .filter((item) => item.status === 'PENDING_DROP_OFF')
        .map((item) => ({ ...item, finder: item.finder && { ...item.finder } })),
    listInOffice: async () =>
      items
        .filter((item) => item.status === 'IN_CUSTODY' || item.status === 'PUBLISHED')
        .map((item) => ({ ...item, finder: item.finder && { ...item.finder } })),
    findByCode: async (code) => {
      const item = items.find((candidate) => candidate.code === code);
      return item ? { ...item, finder: item.finder && { ...item.finder } } : null;
    },
    receivePending: async (itemId, receivedById, receivedAt) => {
      const item = items.find((candidate) => candidate.id === itemId);
      if (!item || item.status !== 'PENDING_DROP_OFF') {
        return false;
      }
      item.status = 'IN_CUSTODY';
      item.receivedById = receivedById;
      item.receivedAt = receivedAt;
      return true;
    },
  };

  return { repository, items };
}
